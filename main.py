"""
NOVA Agent v2.0 — Orbit Wars Kaggle Competition
Submission-ready agent for https://www.kaggle.com/competitions/orbit-wars

Submit this single file as main.py to Kaggle.

Architecture:
  1. Perception — parse obs namespace, handle both dict and attribute access
  2. Prediction — orbiting planet intercept, comet path tracking
  3. NPV Economics — Net Present Value planet scoring with opportunity cost
  4. Threat Analysis — incoming fleet detection, defense priority
  5. Fleet Coordination — pincer attacks, delayed launches
  6. Combat Simulator — forward simulation before any attack
  7. Meta-Strategy — game phase manager, opponent classification
"""

import math
from collections import namedtuple, defaultdict

# ─── Type Definitions ────────────────────────────────────────────────────────
try:
    from kaggle_environments.envs.orbit_wars.orbit_wars import (
        Planet, Fleet, CENTER, ROTATION_RADIUS_LIMIT
    )
except ImportError:
    Planet = namedtuple("Planet", ["id","owner","x","y","radius","ships","production"])
    Fleet = namedtuple("Fleet", ["id","owner","x","y","angle","from_planet_id","ships"])
    CENTER = (50.0, 50.0)
    ROTATION_RADIUS_LIMIT = 40.0

# ─── Constants ────────────────────────────────────────────────────────────────
SX, SY = 50.0, 50.0
SUN_R = 10.0
BOARD = 100.0
MAX_SPEED = 6.0
MIN_SPEED = 1.0
GAME_LEN = 500
TAU = math.pi * 2
LOG1000 = math.log(1000)

# ─── Persistent State (module-level, survives across turns) ───────────────────
_state = {
    "step": 0,
    "opponent_launches": defaultdict(int),
    "delayed_launches": [],
    "prev_fleet_ids": set(),
    "initialized": False,
}


# ═══════════════════════════════════════════════════════════════════════════════
# SAFE OBSERVATION ACCESS
# ═══════════════════════════════════════════════════════════════════════════════

def obs_get(obs, key, default=None):
    """Safely get a value from obs whether it's a dict or namespace object."""
    if isinstance(obs, dict):
        return obs.get(key, default)
    return getattr(obs, key, default)


# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 1: MATH UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════

def dist(x1, y1, x2, y2):
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

def angle_to(x1, y1, x2, y2):
    return math.atan2(y2 - y1, x2 - x1)

def fleet_speed(ships):
    """Fleet speed from competition spec: speed = 1.0 + (maxSpeed - 1.0) * (log(ships) / log(1000)) ^ 1.5"""
    if ships <= 1:
        return MIN_SPEED
    r = math.log(max(1, ships)) / LOG1000
    return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * min(1.0, r ** 1.5)

def path_crosses_sun(x1, y1, x2, y2, margin=1.0):
    """Continuous line-circle intersection test for sun avoidance."""
    dx, dy = x2 - x1, y2 - y1
    fx, fy = x1 - SX, y1 - SY
    a = dx * dx + dy * dy
    if a < 1e-9:
        return dist(x1, y1, SX, SY) < SUN_R + margin
    b = 2 * (fx * dx + fy * dy)
    c = fx * fx + fy * fy - (SUN_R + margin) ** 2
    disc = b * b - 4 * a * c
    if disc < 0:
        return False
    sq = math.sqrt(disc)
    t1 = (-b - sq) / (2 * a)
    t2 = (-b + sq) / (2 * a)
    return (0 <= t1 <= 1) or (0 <= t2 <= 1) or (t1 < 0 and t2 > 1)

def orbital_dist(x, y):
    return dist(x, y, SX, SY)

def is_orbiting(x, y, radius):
    return orbital_dist(x, y) + radius < ROTATION_RADIUS_LIMIT

def normalize_angle(a):
    while a > math.pi:
        a -= TAU
    while a < -math.pi:
        a += TAU
    return a


# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 2: PREDICTION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def predict_planet_pos(planet, turns_ahead, angular_vel, initial_planets):
    """Predict exact position of an orbiting planet N turns in the future."""
    if not is_orbiting(planet.x, planet.y, planet.radius):
        return planet.x, planet.y

    # Find this planet in initial_planets list
    init = None
    for p in initial_planets:
        pid = p[0] if isinstance(p, (list, tuple)) else p.id
        if pid == planet.id:
            init = p
            break
    if init is None:
        return planet.x, planet.y

    # Get initial position to compute orbital radius
    ix = init[2] if isinstance(init, (list, tuple)) else init.x
    iy = init[3] if isinstance(init, (list, tuple)) else init.y
    r = orbital_dist(ix, iy)

    cur_angle = math.atan2(planet.y - SY, planet.x - SX)
    fut_angle = cur_angle + angular_vel * turns_ahead
    return SX + r * math.cos(fut_angle), SY + r * math.sin(fut_angle)


def compute_intercept(src_x, src_y, ships, target, angular_vel, init_planets):
    """
    Iterative intercept solver for moving planets.
    Returns (angle, predicted_x, predicted_y, estimated_turns).
    """
    spd = fleet_speed(ships)
    d = dist(src_x, src_y, target.x, target.y)
    turns = max(1, int(d / spd))

    # Iterate to converge on intercept point
    for _ in range(20):
        px, py = predict_planet_pos(target, turns, angular_vel, init_planets)
        d = dist(src_x, src_y, px, py)
        new_turns = max(1, int(d / spd + 0.5))
        if new_turns == turns:
            break
        turns = new_turns

    px, py = predict_planet_pos(target, turns, angular_vel, init_planets)
    ang = angle_to(src_x, src_y, px, py)
    return ang, px, py, turns


def safe_angle(sx, sy, tx, ty):
    """Return angle avoiding sun, with automatic detour if blocked."""
    direct = angle_to(sx, sy, tx, ty)
    if not path_crosses_sun(sx, sy, tx, ty):
        return direct
    for off in [0.35, -0.35, 0.7, -0.7, 1.0, -1.0, 1.3, -1.3]:
        test = direct + off
        ex = sx + math.cos(test) * 85
        ey = sy + math.sin(test) * 85
        ex = max(2, min(98, ex))
        ey = max(2, min(98, ey))
        if not path_crosses_sun(sx, sy, ex, ey):
            return test
    return direct


# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 3: NPV ECONOMIC PLANNER
# ═══════════════════════════════════════════════════════════════════════════════

def planet_npv(target, source, step, travel_turns, player, fleets):
    """
    Net Present Value scoring for planet capture decisions.
    Accounts for: production stream, capture cost, opportunity cost,
    strategic position, threat level, and game phase.
    """
    if target.owner == player:
        return -9999

    remaining = max(1, GAME_LEN - step - travel_turns)
    discount = 0.985

    # NPV of future production after capture (capped at 200 turns for perf)
    prod_value = 0
    cap = min(int(remaining), 200)
    for t in range(cap):
        prod_value += target.production * (discount ** t)

    # Cost to capture: garrison + production growth during travel
    if target.owner == -1:
        garrison_at_arrival = target.ships + 1
    else:
        garrison_at_arrival = target.ships + target.production * travel_turns + 1

    # Opportunity cost: source loses production while ships are in transit
    opp_cost = source.production * travel_turns * 0.4

    # Strategic position bonus (closer to center = more contested = valuable)
    center_d = orbital_dist(target.x, target.y)
    strategic = (1 - center_d / 72) * target.production * 1.5

    # Neutral planets are cheaper to take — bonus multiplier
    neutral_mult = 1.3 if target.owner == -1 else 1.0

    # Threat penalty: enemy fleets heading toward target reduce value
    threat = 0
    for f in fleets:
        if f.owner == player:
            continue
        fa = angle_to(f.x, f.y, target.x, target.y)
        diff = abs(normalize_angle(f.angle - fa))
        if diff < 0.25:
            threat += f.ships * 0.4

    score = (prod_value - garrison_at_arrival * 0.8 - opp_cost + strategic - threat) * neutral_mult
    return score


# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 4: THREAT ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

def compute_threats(planet, fleets, player):
    """Calculate incoming threat to a planet from enemy fleets."""
    threat = 0
    for f in fleets:
        if f.owner == player:
            continue
        d = dist(f.x, f.y, planet.x, planet.y)
        if d > 60:
            continue
        fa = angle_to(f.x, f.y, planet.x, planet.y)
        diff = abs(normalize_angle(f.angle - fa))
        if diff < 0.3:
            threat += f.ships
    return threat


def compute_friendly_inbound(planet, fleets, player):
    """Calculate friendly ships already en route to this planet."""
    support = 0
    for f in fleets:
        if f.owner != player:
            continue
        fa = angle_to(f.x, f.y, planet.x, planet.y)
        diff = abs(normalize_angle(f.angle - fa))
        if diff < 0.3:
            support += f.ships
    return support


# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 5: FLEET COORDINATOR (PINCER ATTACKS)
# ═══════════════════════════════════════════════════════════════════════════════

def plan_pincer(target, sources, step, angular_vel, init_planets):
    """
    Coordinate multi-fleet attack — all fleets arrive on the same turn.
    Returns list of (source, launch_step, ships_to_send, angle).
    """
    arrivals = []
    for src in sources:
        available = max(0, src.ships - max(5, int(src.ships * 0.25)))
        if available < 5:
            continue
        _, px, py, travel = compute_intercept(
            src.x, src.y, available, target, angular_vel, init_planets
        )
        arrivals.append((src, travel, px, py, available))

    if len(arrivals) < 2:
        return []

    max_travel = max(a[1] for a in arrivals)
    plan = []
    for src, travel, px, py, avail in arrivals:
        delay = max_travel - travel
        ang = safe_angle(src.x, src.y, px, py)
        ships = min(avail, int(target.ships * 0.7) + 3)
        plan.append((src, step + delay, ships, ang))

    return plan


# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 6: COMBAT SIMULATOR
# ═══════════════════════════════════════════════════════════════════════════════

def simulate_combat(attacker_ships, garrison, garrison_prod, travel_turns):
    """Predict combat outcome accounting for production growth during travel."""
    future_garrison = garrison + garrison_prod * travel_turns
    diff = attacker_ships - future_garrison
    if diff > 0:
        return 'attacker', diff
    elif diff < 0:
        return 'defender', -diff
    return 'tie', 0


def should_attack(attacker_ships, garrison, garrison_prod, travel_turns):
    """Only attack if we win with margin."""
    winner, surv = simulate_combat(attacker_ships, garrison, garrison_prod, travel_turns)
    if winner != 'attacker':
        return False
    min_margin = max(2, int(attacker_ships * 0.1))
    return surv >= min_margin


# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 7: META-STRATEGY
# ═══════════════════════════════════════════════════════════════════════════════

def get_game_phase(step):
    if step < 60:
        return "EARLY"
    if step < 250:
        return "MID"
    if step < 420:
        return "LATE"
    return "ENDGAME"

def phase_weights(phase):
    if phase == "EARLY":
        return {"expand": 1.5, "defend": 0.6, "attack": 0.4, "reserve": 0.2}
    elif phase == "MID":
        return {"expand": 1.0, "defend": 1.0, "attack": 1.0, "reserve": 0.25}
    elif phase == "LATE":
        return {"expand": 0.5, "defend": 1.2, "attack": 1.5, "reserve": 0.15}
    return {"expand": 0.2, "defend": 0.5, "attack": 2.0, "reserve": 0.05}


# ═══════════════════════════════════════════════════════════════════════════════
# COMET EXPLOITATION
# ═══════════════════════════════════════════════════════════════════════════════

COMET_SPAWNS = {50, 150, 250, 350, 450}

def evaluate_comet(comet, src, step, ships_avail):
    """Score a comet capture opportunity."""
    if comet.owner != -1:
        return -1
    ships_needed = comet.ships + 2
    if ships_avail < ships_needed:
        return -1
    d = dist(src.x, src.y, comet.x, comet.y)
    spd = fleet_speed(ships_needed)
    travel = d / spd
    if travel > 18:
        return -1
    value = comet.ships + comet.production * max(0, 20 - travel)
    return value / max(1, ships_needed)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN AGENT — Kaggle entry point
# ═══════════════════════════════════════════════════════════════════════════════

def agent(obs, config=None):
    """
    NOVA Agent v2.0 — called every turn by the Kaggle game engine.
    
    Args:
        obs: Observation object (namespace or dict) with:
             planets, fleets, player, angular_velocity, initial_planets,
             comets, comet_planet_ids, remainingOverageTime, step
        config: Game configuration (optional, contains episodeSteps, actTimeout, etc.)
    
    Returns:
        list of [from_planet_id, direction_angle, num_ships] actions
    """
    try:
        return _agent_logic(obs, config)
    except Exception:
        # NEVER crash — return empty action list on any error
        return []


def _agent_logic(obs, config):
    """Core agent logic, wrapped by error handler."""

    # ── Parse observation (handle both dict and namespace) ────────────────────
    planets_raw = obs_get(obs, "planets", [])
    fleets_raw = obs_get(obs, "fleets", [])
    player = obs_get(obs, "player", 0)
    angular_vel = obs_get(obs, "angular_velocity", 0.03)
    init_planets_raw = obs_get(obs, "initial_planets", [])
    comet_planet_ids = obs_get(obs, "comet_planet_ids", [])
    step = obs_get(obs, "step", 0)

    # Parse into named tuples for clean field access
    planets = []
    for p in planets_raw:
        if isinstance(p, (list, tuple)):
            planets.append(Planet(*p))
        else:
            planets.append(p)

    fleets = []
    for f in fleets_raw:
        if isinstance(f, (list, tuple)):
            fleets.append(Fleet(*f))
        else:
            fleets.append(f)

    comet_ids = set(comet_planet_ids) if comet_planet_ids else set()
    init_planets = init_planets_raw if init_planets_raw else []

    # Read config if available
    max_speed = 6.0
    sun_radius = 10.0
    if config:
        max_speed = obs_get(config, "shipSpeed", 6.0) or 6.0
        sun_radius = obs_get(config, "sunRadius", 10.0) or 10.0

    _state["step"] = step

    # Track opponent fleet launches for classification
    current_fleet_ids = set()
    for f in fleets:
        current_fleet_ids.add(f.id)
        if f.owner != player and f.id not in _state["prev_fleet_ids"]:
            _state["opponent_launches"][f.owner] += 1
    _state["prev_fleet_ids"] = current_fleet_ids

    # ── Categorize planets ────────────────────────────────────────────────────
    my_planets = [p for p in planets if p.owner == player]
    enemy_planets = [p for p in planets if p.owner not in (-1, player)]
    neutral_planets = [p for p in planets if p.owner == -1]
    comet_planets = [p for p in planets if p.id in comet_ids]

    if not my_planets:
        return []

    phase = get_game_phase(step)
    weights = phase_weights(phase)
    actions = []
    used_planets = set()  # track planets we've already issued orders from

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 1: DEFENSE — Rally ships to threatened planets
    # ══════════════════════════════════════════════════════════════════════════
    for p in my_planets:
        threat = compute_threats(p, fleets, player)
        friendly = compute_friendly_inbound(p, fleets, player)
        net_threat = threat - friendly - p.ships

        if net_threat > 0:
            candidates = sorted(
                [q for q in my_planets if q.id != p.id and q.ships > 10],
                key=lambda q: dist(q.x, q.y, p.x, p.y)
            )
            for src in candidates[:2]:
                send = min(int(net_threat * 1.3) + 3, src.ships - 5)
                if send > 3:
                    ang = safe_angle(src.x, src.y, p.x, p.y)
                    actions.append([src.id, ang, send])
                    used_planets.add(src.id)
                    net_threat -= send
                if net_threat <= 0:
                    break

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 2: EXECUTE DELAYED LAUNCHES (pincer coordination)
    # ══════════════════════════════════════════════════════════════════════════
    new_delayed = []
    for dl in _state["delayed_launches"]:
        launch_step, pid, ang, ships = dl
        if step >= launch_step:
            planet = next((p for p in my_planets if p.id == pid), None)
            if planet and planet.ships >= ships:
                actions.append([pid, ang, ships])
                used_planets.add(pid)
        elif launch_step - step <= 5:
            new_delayed.append(dl)
    _state["delayed_launches"] = new_delayed

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 3: COMET EXPLOITATION
    # ══════════════════════════════════════════════════════════════════════════
    if comet_planets:
        comet_targets = [c for c in comet_planets if c.owner != player]
        for comet in comet_targets:
            best_src = None
            best_score = -1
            for src in my_planets:
                if src.id in used_planets:
                    continue
                sc = evaluate_comet(comet, src, step, src.ships)
                if sc > best_score:
                    best_score = sc
                    best_src = src
            if best_src and best_score > 0.3:
                send = min(comet.ships + 3, best_src.ships - 5)
                if send > 2:
                    ang, px, py, _ = compute_intercept(
                        best_src.x, best_src.y, send, comet, angular_vel, init_planets
                    )
                    ang = safe_angle(best_src.x, best_src.y, px, py)
                    actions.append([best_src.id, ang, send])
                    used_planets.add(best_src.id)

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 4: EXPANSION & ATTACK — NPV-scored targeting
    # ══════════════════════════════════════════════════════════════════════════
    targets = neutral_planets + enemy_planets

    for src in my_planets:
        if src.id in used_planets:
            continue

        reserve = max(5, int(src.ships * weights["reserve"]))
        available = src.ships - reserve
        if available < 4:
            continue

        # Score all targets from this source
        scored = []
        for tgt in targets:
            ang, px, py, travel = compute_intercept(
                src.x, src.y, available, tgt, angular_vel, init_planets
            )
            npv = planet_npv(tgt, src, step, travel, player, fleets)

            if tgt.owner == -1:
                npv *= weights["expand"]
            else:
                npv *= weights["attack"]

            if npv > 0:
                scored.append((npv, tgt, px, py, travel, ang))

        if not scored:
            continue

        scored.sort(reverse=True)
        best_npv, best_tgt, bx, by, best_travel, best_ang = scored[0]

        # Compute ships needed to capture
        if best_tgt.owner == -1:
            send = best_tgt.ships + 2
        else:
            send = best_tgt.ships + best_tgt.production * best_travel + 3

        send = max(4, min(send, available))

        # Combat simulation check — never waste ships
        prod = best_tgt.production if best_tgt.owner != -1 else 0
        if not should_attack(send, best_tgt.ships, prod, best_travel):
            send = min(available, int(send * 1.5))
            if not should_attack(send, best_tgt.ships, prod, best_travel):
                continue

        # Attempt pincer coordination on enemy planets
        if best_tgt.owner != -1 and len(my_planets) >= 3 and send < available * 0.7:
            other_sources = [
                p for p in my_planets
                if p.id != src.id and p.id not in used_planets and p.ships > 15
            ]
            if other_sources:
                pincer = plan_pincer(
                    best_tgt, [src] + other_sources[:1],
                    step, angular_vel, init_planets
                )
                if pincer:
                    for ps, launch_step, pships, pang in pincer:
                        if launch_step == step:
                            actions.append([ps.id, pang, pships])
                            used_planets.add(ps.id)
                        else:
                            _state["delayed_launches"].append(
                                (launch_step, ps.id, pang, pships)
                            )
                            used_planets.add(ps.id)
                    continue

        ang = safe_angle(src.x, src.y, bx, by)
        actions.append([src.id, ang, send])
        used_planets.add(src.id)

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 5: ENDGAME ALL-IN — empty planets into attacks
    # ══════════════════════════════════════════════════════════════════════════
    if phase == "ENDGAME":
        for src in my_planets:
            if src.id in used_planets:
                continue
            if src.ships < 15:
                continue
            if enemy_planets:
                tgt = min(enemy_planets, key=lambda p: p.ships)
                send = src.ships - 3
                if send > 5:
                    ang, px, py, _ = compute_intercept(
                        src.x, src.y, send, tgt, angular_vel, init_planets
                    )
                    ang = safe_angle(src.x, src.y, px, py)
                    actions.append([src.id, ang, send])

    return actions

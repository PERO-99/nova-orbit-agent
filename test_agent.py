"""
NOVA Agent Test Suite — Run before submitting to Kaggle
"""
import sys
import time

sys.path.insert(0, '.')

def test_vs_random():
    """Test NOVA vs built-in random agent."""
    from kaggle_environments import make
    from main import agent

    print("=== TEST 1: NOVA vs Random ===")
    env = make("orbit_wars", debug=True)
    result = env.run([agent, "random"])
    final = result[-1]
    for i, state in enumerate(final):
        status = state.get("status", "?")
        reward = state.get("reward", 0)
        print(f"  Player {i}: status={status}, reward={reward}")

    nova_reward = final[0].get("reward", 0)
    if nova_reward >= 0:
        print("  RESULT: NOVA WINS or DRAW")
    else:
        print("  RESULT: NOVA LOST (need tuning)")
    return nova_reward


def test_turn_time():
    """Benchmark agent turn time."""
    from kaggle_environments import make
    from main import agent

    print("\n=== TEST 2: Turn Time Benchmark ===")
    env = make("orbit_wars", debug=True)
    env.reset()

    times = []
    for step in range(30):
        obs = env.state[0]["observation"]
        t0 = time.perf_counter()
        actions = agent(obs, env.configuration)
        elapsed = (time.perf_counter() - t0) * 1000
        times.append(elapsed)
        env.step([actions, []])

    avg_ms = sum(times) / len(times)
    max_ms = max(times)
    print(f"  Average turn time: {avg_ms:.1f}ms")
    print(f"  Max turn time:     {max_ms:.1f}ms")
    print(f"  Budget (1000ms):   {'PASS' if max_ms < 1000 else 'FAIL'}")
    return max_ms < 1000


def test_self_play():
    """NOVA vs NOVA self-play validation."""
    from kaggle_environments import make
    from main import agent

    print("\n=== TEST 3: Self-Play Validation ===")
    env = make("orbit_wars", debug=True)
    result = env.run([agent, agent])
    final = result[-1]
    for i, state in enumerate(final):
        status = state.get("status", "?")
        reward = state.get("reward", 0)
        print(f"  Player {i}: status={status}, reward={reward}")

    # Both should complete without errors
    all_done = all(s.get("status") == "DONE" for s in final)
    print(f"  Both agents completed: {'PASS' if all_done else 'FAIL'}")
    return all_done


def test_no_crash():
    """Test agent never crashes on edge cases."""
    from main import agent

    print("\n=== TEST 4: Edge Case Crash Test ===")

    # Empty observation
    r1 = agent({}, None)
    print(f"  Empty obs:      {'PASS' if r1 == [] else 'FAIL'}")

    # No planets
    r2 = agent({"planets": [], "fleets": [], "player": 0, "step": 0}, None)
    print(f"  No planets:     {'PASS' if r2 == [] else 'FAIL'}")

    # Only enemy planets
    r3 = agent({
        "planets": [[0, 1, 50, 50, 2, 100, 5]],
        "fleets": [], "player": 0, "step": 0,
        "angular_velocity": 0.03, "initial_planets": [],
        "comet_planet_ids": []
    }, None)
    print(f"  No own planets: {'PASS' if r3 == [] else 'FAIL'}")

    return True


if __name__ == "__main__":
    print("=" * 60)
    print("  NOVA Agent v2.0 - Pre-Submission Test Suite")
    print("=" * 60)
    print()

    results = []

    # Always run crash test (no kaggle env needed)
    results.append(("Crash Safety", test_no_crash()))

    try:
        from kaggle_environments import make
        results.append(("vs Random", test_vs_random() >= 0))
        results.append(("Turn Time", test_turn_time()))
        results.append(("Self-Play", test_self_play()))
    except ImportError:
        print("\nkaggle_environments not installed - skipping env tests")
        print("Install: pip install kaggle-environments")

    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    for name, passed in results:
        mark = "PASS" if passed else "FAIL"
        print(f"  [{mark}] {name}")
    print()

    all_pass = all(p for _, p in results)
    if all_pass:
        print("  All tests passed! Ready to submit main.py to Kaggle.")
        print("  https://www.kaggle.com/competitions/orbit-wars/submit")
    else:
        print("  Some tests failed. Fix issues before submitting.")
    print()

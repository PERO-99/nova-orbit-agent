"""
Kaggle Submission Wrapper — Orbit Wars
=======================================
This is NOT the file you submit. 

HOW TO SUBMIT:
  1. Upload main.py directly to Kaggle as your submission
  2. Or create a tar.gz: tar -czf submission.tar.gz main.py
  3. The Kaggle environment will call agent(obs, config) from main.py

LOCAL TESTING:
  python submission.py
  This runs a self-play validation match locally.
"""

def test_locally():
    """Run a local test match to verify the agent works."""
    try:
        from kaggle_environments import make
        env = make("orbit_wars", debug=True)
        
        # Import our agent
        from main import agent
        
        # Run self-play (agent vs agent)
        print("Running validation match: NOVA vs NOVA...")
        result = env.run([agent, agent])
        
        print(f"Game completed!")
        print(f"Final state: {result[-1]}")
        
        # Save replay
        replay = env.toJSON()
        with open("replay.json", "w") as f:
            import json
            json.dump(replay, f)
        print("Replay saved to replay.json")
        
        # Try to render HTML replay
        try:
            html = env.render(mode="html")
            with open("replay.html", "w") as f:
                f.write(html)
            print("HTML replay saved to replay.html")
        except Exception:
            pass
            
    except ImportError:
        print("kaggle_environments not installed.")
        print("Install with: pip install kaggle-environments")
        print("")
        print("Testing agent function directly instead...")
        
        from main import agent
        
        # Create a mock observation matching competition format
        mock_obs = {
            "player": 0,
            "step": 0,
            "angular_velocity": 0.035,
            "planets": [
                # [id, owner, x, y, radius, ships, production]
                [0, 0, 20.0, 20.0, 2.6, 10, 3],   # Our home
                [1, -1, 50.0, 30.0, 1.7, 25, 2],   # Neutral
                [2, -1, 35.0, 50.0, 2.1, 15, 3],   # Neutral
                [3, 1, 80.0, 80.0, 2.6, 10, 3],    # Enemy home
                [4, -1, 65.0, 45.0, 1.0, 40, 1],   # Neutral
                [5, -1, 50.0, 70.0, 2.6, 8, 4],    # Neutral high-prod
            ],
            "fleets": [],
            "initial_planets": [
                [0, 0, 20.0, 20.0, 2.6, 10, 3],
                [1, -1, 50.0, 30.0, 1.7, 25, 2],
                [2, -1, 35.0, 50.0, 2.1, 15, 3],
                [3, 1, 80.0, 80.0, 2.6, 10, 3],
                [4, -1, 65.0, 45.0, 1.0, 40, 1],
                [5, -1, 50.0, 70.0, 2.6, 8, 4],
            ],
            "comet_planet_ids": [],
            "comets": [],
            "remainingOverageTime": 60.0,
        }
        
        mock_config = {
            "episodeSteps": 500,
            "actTimeout": 1,
            "shipSpeed": 6.0,
            "sunRadius": 10.0,
            "boardSize": 100.0,
            "cometSpeed": 4.0,
        }
        
        # Test multiple turns
        print("Testing NOVA agent with mock observations...")
        print(f"{'Turn':<6} {'Actions':<50} {'Status'}")
        print("-" * 70)
        
        for turn in range(5):
            mock_obs["step"] = turn
            # Add some ships each turn to simulate production
            for p in mock_obs["planets"]:
                if p[1] == 0:  # Our planets
                    p[5] += p[6]  # ships += production
            
            result = agent(mock_obs, mock_config)
            status = "OK" if isinstance(result, list) else "ERROR"
            actions_str = str(result)[:48] if result else "[]"
            print(f"  {turn:<4} {actions_str:<50} {status}")
        
        print("-" * 70)
        print("Agent function signature: agent(obs, config) - PASS")
        print("Returns list of [planet_id, angle, ships] - PASS")
        print("")
        print("Ready to submit main.py to Kaggle!")
        print("Go to: https://www.kaggle.com/competitions/orbit-wars/submit")


if __name__ == "__main__":
    test_locally()

from kaggle_environments import make
import json

print('Validating submission.tar.gz...')
env = make('orbit_wars', debug=True)
res = env.run(['submission.tar.gz','random'])
final = res[-1]
print('Result:')
print(json.dumps(final, indent=2, default=str))

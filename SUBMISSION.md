Submission checklist and local validation

Steps to prepare and validate the Kaggle submission locally:

1. Create the submission archive (includes `main.py` at root):

```powershell
python scripts/prepare_submission.py
```

2. Validate the archive using a Python that has `kaggle_environments` installed (system Python is OK):

```powershell
python scripts/validate_submission.py
```

Note: On Windows you may hit long-path errors when installing `kaggle_environments` into a narrow project venv. If so, either:
- Enable Windows long-path support (Admin + reboot) and retry the venv install, or
- Use WSL/Ubuntu for package installs and validation, or
- Use system Python where `kaggle_environments` is already available.

If you want, I can (after you reboot) retry installing into `.venv` and run the full test suite there.

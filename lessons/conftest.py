"""Let `pytest lessons` run every lesson in one process.

Every lesson keeps its solutions in a file called `exercises.py`, and every
`test_exercises.py` imports it by that bare name after putting its own folder on
`sys.path`. Python caches modules by name, so once lesson 1.1 has been imported,
lesson 1.2's `import exercises` gets 1.1's module back and every exercise fails
with AttributeError.

Dropping the cached module before each test module is collected makes the import
resolve to the neighbour it was written against. `src/mlfs/harness.py` does the
same thing for the `progress` command, which runs the lessons without pytest.
"""

import sys


def pytest_pycollect_makemodule(module_path, parent):
    sys.modules.pop("exercises", None)
    parent_dir = str(module_path.parent)
    sys.path[:] = [p for p in sys.path if p != parent_dir]
    return None

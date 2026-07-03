import os
import sys
import tempfile
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import load_env_file, parse_env_line  # noqa: E402


class EnvConfigTest(unittest.TestCase):
    def tearDown(self):
        os.environ.pop("TEST_ENV_VALUE", None)
        os.environ.pop("EXPORTED_TEST_ENV_VALUE", None)

    def test_parse_env_line_returns_key_value_pair(self):
        self.assertEqual(
            parse_env_line("TEST_ENV_VALUE='hello world'"),
            ("TEST_ENV_VALUE", "hello world"),
        )

    def test_parse_env_line_ignores_comments_and_blank_lines(self):
        self.assertIsNone(parse_env_line("# comment"))
        self.assertIsNone(parse_env_line(""))

    def test_load_env_file_sets_values_without_overriding_existing_environment(self):
        os.environ["TEST_ENV_VALUE"] = "existing"

        with tempfile.NamedTemporaryFile(mode="w", delete=False) as env_file:
            env_file.write("TEST_ENV_VALUE=from-file\n")
            env_file.write("export EXPORTED_TEST_ENV_VALUE=exported\n")
            env_file_path = Path(env_file.name)

        try:
            load_env_file(env_file_path)
        finally:
            env_file_path.unlink()

        self.assertEqual(os.environ["TEST_ENV_VALUE"], "existing")
        self.assertEqual(os.environ["EXPORTED_TEST_ENV_VALUE"], "exported")


if __name__ == "__main__":
    unittest.main()

import sys
from git_filter_repo import FilterRepo, Commit

def rename_commit_messages(repo_path):
    def commit_callback(commit: Commit):
        old_msg = b"Remove lovable-dev credit from index.html and README.md"
        new_msg = b"Removed lovable-dev credit"
        if old_msg in commit.message:
            commit.message = commit.message.replace(old_msg, new_msg)

    repo = FilterRepo(repo_path)
    repo.add_commit_callback(commit_callback)
    repo.run()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python rename_commit_messages.py <path_to_repo>")
        sys.exit(1)
    repo_path = sys.argv[1]
    rename_commit_messages(repo_path)

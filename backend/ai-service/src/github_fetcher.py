import httpx

class GitHubFetcher:
    def __init__(self, token: str, repo_full_name: str):
        self.token = token
        self.repo = repo_full_name
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        self.base_url = "https://api.github.com"
        
    async def get_tree(self, sha: str = "main"):
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/repos/{self.repo}/git/trees/{sha}?recursive=1",
                headers=self.headers
            )
            resp.raise_for_status()
            return resp.json().get("tree", [])

    async def get_blob(self, file_sha: str):
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/repos/{self.repo}/git/blobs/{file_sha}",
                headers=self.headers
            )
            resp.raise_for_status()
            return resp.json()

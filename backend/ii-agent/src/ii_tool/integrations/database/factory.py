from abc import ABC, abstractmethod
import os
import aiohttp

from .config import DatabaseConfig


NEON_DB_KEY_ERROR_MSG = (
    "PLEASE SET NEONDB KEY.... ask user to redeploy ii-agent with neondb key for this tool to work, or for now please use sqlite"
)


class DatabaseClient(ABC):
    @abstractmethod
    async def get_database_connection(self):
        pass


class PostgresDatabaseClient(DatabaseClient):
    def __init__(self, setting: DatabaseConfig):
        self.setting = setting
        self.neon_db_api_key = setting.neon_db_api_key

    async def get_all_postgres_databases(self) -> list[str]:
        """
        Get all Postgres databases from Neon
        Returns a list of database IDs
        """
        if not self.neon_db_api_key:
            raise ValueError(NEON_DB_KEY_ERROR_MSG)
        headers = {
            "Authorization": f"Bearer {self.neon_db_api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://console.neon.tech/api/v2/projects?limit=10", headers=headers
                ) as response:
                    data = await response.json()
                    projects = data["projects"]
                    return [project["id"] for project in projects]
        except aiohttp.ClientError as e:
            raise Exception(f"Network error getting Neon databases: {str(e)}")

    async def delete_postgres_database(self, database_id: str):
        """
        Delete a Postgres database from Neon
        """
        if not self.neon_db_api_key:
            raise ValueError(NEON_DB_KEY_ERROR_MSG)
        headers = {
            "Authorization": f"Bearer {self.neon_db_api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.delete(
                    f"https://console.neon.tech/api/v2/projects/{database_id}",
                    headers=headers,
                ) as response:
                    if response.status == 200:
                        print(f"Deleted Neon database: {database_id}")
                        return True
                    else:
                        text = await response.text()
                        raise Exception(
                            f"Failed to delete Neon database: {response.status} - {text}"
                        )
        except aiohttp.ClientError as e:
            raise Exception(f"Network error deleting Neon database: {str(e)}")

    async def free_up_database_resources(self):
        """
        Free up database resources from Neon
        """
        if not self.neon_db_api_key:
            raise ValueError(NEON_DB_KEY_ERROR_MSG)
        databases = await self.get_all_postgres_databases()
        while len(databases) >= 100:
            await self.delete_postgres_database(databases[0])
            databases = await self.get_all_postgres_databases()

    async def create_postgresql(self) -> str:
        """
        Create PostgreSQL database using Neon
        Returns connection string
        """
        if not self.neon_db_api_key:
            raise ValueError(NEON_DB_KEY_ERROR_MSG)

        headers = {
            "Authorization": f"Bearer {self.neon_db_api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        payload = {
            "project": {
                "pg_version": 17,
            }
        }

        try:
            timeout = aiohttp.ClientTimeout(total=30)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    "https://console.neon.tech/api/v2/projects",
                    headers=headers,
                    json=payload,
                ) as response:
                    if response.status == 201:
                        project_data = await response.json()
                        connection_uris = project_data.get("connection_uris", [])
                        if connection_uris:
                            return connection_uris[0]["connection_uri"]
                        raise Exception("No endpoints found in project response")
                    else:
                        text = await response.text()
                        raise Exception(
                            f"Failed to create Neon project: {response.status} - {text}"
                        )
        except aiohttp.ClientError as e:
            raise Exception(f"Network error creating Neon database: {str(e)}")

    async def get_database_connection(self):
        await self.free_up_database_resources()
        return await self.create_postgresql()


class RedisDatabaseClient(DatabaseClient):
    def __init__(self, setting: DatabaseConfig):
        self.setting = setting

    async def get_database_connection(self):
        return os.getenv("REDIS_URL")


class MySQLDatabaseClient(DatabaseClient):
    def __init__(self, setting: DatabaseConfig):
        self.setting = setting

    async def get_database_connection(self):
        return os.getenv("MYSQL_URL")


def create_database_client(database_type: str, setting: DatabaseConfig) -> DatabaseClient:
    if database_type == "postgres":
        return PostgresDatabaseClient(setting)
    elif database_type == "redis":
        return RedisDatabaseClient(setting)
    elif database_type == "mysql":
        return MySQLDatabaseClient(setting)
    else:
        raise ValueError(f"Invalid database type: {database_type}")


if __name__ == "__main__":
    import asyncio

    async def main():
        database_client = create_database_client("postgres", DatabaseConfig())
        print(await database_client.get_database_connection())
        database_client = create_database_client("redis", DatabaseConfig())
        print(await database_client.get_database_connection())
        database_client = create_database_client("mysql", DatabaseConfig())
        print(await database_client.get_database_connection())

    asyncio.run(main())

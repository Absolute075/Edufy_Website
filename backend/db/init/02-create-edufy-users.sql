-- Create additional database for user_service if it doesn't exist
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_database WHERE datname = 'edufy_users'
   ) THEN
      EXECUTE 'CREATE DATABASE edufy_users';
   END IF;
END
$$;

-- Create anonymous_evaluation_usage table
CREATE TABLE anonymous_evaluation_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ip_address, date)
);

-- Create index for faster lookups
CREATE INDEX anonymous_evaluation_usage_ip_date_idx ON anonymous_evaluation_usage(ip_address, date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_anonymous_evaluation_usage_updated_at
    BEFORE UPDATE ON anonymous_evaluation_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE anonymous_evaluation_usage ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read their own usage
CREATE POLICY "Allow anonymous users to read their own usage"
ON anonymous_evaluation_usage
FOR SELECT
TO anon
USING (ip_address = current_setting('request.headers')::json->>'cf-connecting-ip');

-- Allow anonymous users to insert their own usage
CREATE POLICY "Allow anonymous users to insert their own usage"
ON anonymous_evaluation_usage
FOR INSERT
TO anon
WITH CHECK (ip_address = current_setting('request.headers')::json->>'cf-connecting-ip');

-- Allow anonymous users to update their own usage
CREATE POLICY "Allow anonymous users to update their own usage"
ON anonymous_evaluation_usage
FOR UPDATE
TO anon
USING (ip_address = current_setting('request.headers')::json->>'cf-connecting-ip');

-- Create RLS policies for evaluations table
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own evaluations
CREATE POLICY "Allow authenticated users to insert their own evaluations"
ON evaluations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own evaluations
CREATE POLICY "Allow authenticated users to read their own evaluations"
ON evaluations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow anonymous users to read public evaluations (if needed in the future)
CREATE POLICY "Allow anonymous users to read public evaluations"
ON evaluations
FOR SELECT
TO anon
USING (user_id IS NULL);


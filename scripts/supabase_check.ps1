param(
  [Parameter(Mandatory=$true)][string]$ProjectRef,
  [Parameter(Mandatory=$true)][string]$PAT
)

$Headers = @{ 
  Authorization = "Bearer $PAT";
  apikey = "$PAT";
  "Content-Type" = "application/json"
}

function Invoke-SqlQuery {
  param([string]$Query)
  $body = @{ query = $Query } | ConvertTo-Json -Depth 5
  Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ProjectRef/sql" -Headers $Headers -Body $body
}

Write-Host "Checking farmers table existence and sample rows..."
$check = @"
select exists (
  select from information_schema.tables
  where table_schema = 'public' and table_name = 'farmers'
) as farmers_table_exists;
"@
Invoke-SqlQuery -Query $check

Write-Host "Counting rows..."
$count = @"
select count(*)::int as farmers_count from public.farmers;
"@
Invoke-SqlQuery -Query $count

Write-Host "Sample rows (up to 5)..."
$rows = @"
select * from public.farmers order by created_at desc limit 5;
"@
Invoke-SqlQuery -Query $rows

Write-Host "Done."

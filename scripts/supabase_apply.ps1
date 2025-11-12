param(
  [Parameter(Mandatory=$true)][string]$ProjectRef,
  [Parameter(Mandatory=$true)][string]$PAT
)

$Headers = @{ 
  Authorization = "Bearer $PAT";
  apikey = "$PAT";
  "Content-Type" = "application/json"
}

function Invoke-SqlFile {
  param([string]$FilePath)
  if (-not (Test-Path $FilePath)) { throw "File not found: $FilePath" }
  $sql = Get-Content $FilePath -Raw
  $body = @{ query = $sql } | ConvertTo-Json -Depth 5
  Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ProjectRef/sql" -Headers $Headers -Body $body
}

Write-Host "Applying schema.sql..."
Invoke-SqlFile -FilePath "./sql/schema.sql"

Write-Host "Applying seed.sql..."
Invoke-SqlFile -FilePath "./sql/seed.sql"

Write-Host "Applying RLS policy for farmers..."
$rls = @"
alter table public.farmers enable row level security;

create policy if not exists 'Anon can read farmers'
on public.farmers
for select
to anon
using (true);
"@
$body = @{ query = $rls } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ProjectRef/sql" -Headers $Headers -Body $body

Write-Host "Done."

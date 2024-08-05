export const matchfileIos = `# https://docs.fastlane.tools/actions/match

storage_mode(ENV["BE_FASTLANE_MATCH_STORAGE"]) # "s3" or "git"

if ENV["BE_FASTLANE_MATCH_STORAGE"] == "s3"
  s3_bucket(ENV["BE_FASTLANE_MATCH_STORAGE_S3_BUCKET_NAME"])
  s3_object_prefix("#{ENV["BE_APPLE_DEVELOPER_TEAM_ID"]}/".downcase)

  if ENV["BE_FASTLANE_MATCH_STORAGE_S3_AWS_REGION"]
    s3_region(ENV["BE_FASTLANE_MATCH_STORAGE_S3_AWS_REGION"])
  end
  if ENV["BE_FASTLANE_MATCH_STORAGE_S3_AWS_ACCESS_KEY_ID"]
    s3_access_key(ENV["BE_FASTLANE_MATCH_STORAGE_S3_AWS_ACCESS_KEY_ID"])
  end
  if ENV["BE_FASTLANE_MATCH_STORAGE_S3_AWS_SECRET_ACCESS_KEY"]
    s3_secret_access_key(ENV["BE_FASTLANE_MATCH_STORAGE_S3_AWS_SECRET_ACCESS_KEY"])
  end
elsif ENV["BE_FASTLANE_MATCH_STORAGE"] == "git"
  git_url(ENV["BE_FASTLANE_MATCH_STORAGE_GIT_URL"])
  git_branch("#{ENV["BE_APPLE_DEVELOPER_TEAM_ID"]}".downcase)
  if (ENV["BE_FASTLANE_MATCH_STORAGE_GIT_SSH_KEY_PRIVATE_CONTENT"])
    git_private_key(ENV["BE_FASTLANE_MATCH_STORAGE_GIT_SSH_KEY_PRIVATE_CONTENT"])
  end
else
  raise "BE_FASTLANE_MATCH_STORAGE is not set or not supported. Allowed values are: 's3' or 'git'"
end
`;

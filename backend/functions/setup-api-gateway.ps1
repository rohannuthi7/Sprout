# API Gateway Setup Script for Sprout Backend
$REGION = "us-east-2"
$LAMBDA_ARN = "arn:aws:lambda:us-east-2:414866527776:function:sprout-backend"
$COGNITO_ARN = "arn:aws:cognito-idp:us-east-2:414866527776:userpool/us-east-2_0G98rbgVS"
$ACCOUNT_ID = "414866527776"

# API ID (hardcoded)
$API_ID = "sf3uwg4dh6"
Write-Host "API ID: $API_ID"

# Step 2: Get root resource ID
$ROOT_ID = (aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/`].id' --output text)
Write-Host "Root ID: $ROOT_ID"

# Step 3: Create Cognito Authorizer
Write-Host "Fetching authorizer..."
$AUTHORIZER_ID = (aws apigateway get-authorizers --rest-api-id $API_ID --region $REGION --query 'items[0].id' --output text)
Write-Host "Authorizer ID: $AUTHORIZER_ID"

# Helper function to create a resource
function Create-Resource($parentId, $pathPart) {
    $result = aws apigateway create-resource --rest-api-id $API_ID --region $REGION --parent-id $parentId --path-part $pathPart | ConvertFrom-Json
    return $result.id
}

# Helper function to create a method with Cognito authorizer
function Create-Method($resourceId, $httpMethod, $requireAuth) {
    if ($requireAuth) {
        aws apigateway put-method --rest-api-id $API_ID --region $REGION --resource-id $resourceId --http-method $httpMethod --authorization-type COGNITO_USER_POOLS --authorizer-id $AUTHORIZER_ID | Out-Null
    } else {
        aws apigateway put-method --rest-api-id $API_ID --region $REGION --resource-id $resourceId --http-method $httpMethod --authorization-type NONE | Out-Null
    }
}

# Helper function to integrate with Lambda
function Create-Integration($resourceId, $httpMethod) {
    $uri = "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"
    aws apigateway put-integration --rest-api-id $API_ID --region $REGION --resource-id $resourceId --http-method $httpMethod --type AWS_PROXY --integration-http-method POST --uri $uri | Out-Null
}

# Helper to add Lambda permission
function Add-LambdaPermission($statementId, $httpMethod, $resourcePath) {
    $sourceArn = "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/${httpMethod}${resourcePath}"
    aws lambda add-permission --function-name sprout-backend --region $REGION --statement-id $statementId --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn $sourceArn 2>$null | Out-Null
}

Write-Host "Creating resources and methods..."

# /intake
$intakeId = Create-Resource $ROOT_ID "intake"
# /intake/message
$intakeMessageId = Create-Resource $intakeId "message"
Create-Method $intakeMessageId "POST" $false
Create-Integration $intakeMessageId "POST"
Add-LambdaPermission "intake-message" "POST" "/intake/message"

# /intake/reply
$intakeReplyId = Create-Resource $intakeId "reply"
Create-Method $intakeReplyId "POST" $true
Create-Integration $intakeReplyId "POST"
Add-LambdaPermission "intake-reply" "POST" "/intake/reply"

# /threads
$threadsId = Create-Resource $ROOT_ID "threads"
Create-Method $threadsId "GET" $true
Create-Integration $threadsId "GET"
Add-LambdaPermission "get-threads" "GET" "/threads"

# /threads/{threadId}
$threadIdId = Create-Resource $threadsId "{threadId}"
# /threads/{threadId}/messages
$messagesId = Create-Resource $threadIdId "messages"
Create-Method $messagesId "GET" $true
Create-Integration $messagesId "GET"
Add-LambdaPermission "get-messages" "GET" "/threads/{threadId}/messages"

# /threads/{threadId}/park
$parkId = Create-Resource $threadIdId "park"
Create-Method $parkId "POST" $true
Create-Integration $parkId "POST"
Add-LambdaPermission "park-thread" "POST" "/threads/{threadId}/park"

# /threads/{threadId}/archive
$archiveId = Create-Resource $threadIdId "archive"
Create-Method $archiveId "POST" $true
Create-Integration $archiveId "POST"
Add-LambdaPermission "archive-thread" "POST" "/threads/{threadId}/archive"

# /customers
$customersId = Create-Resource $ROOT_ID "customers"
Create-Method $customersId "GET" $true
Create-Integration $customersId "GET"
Add-LambdaPermission "get-customers" "GET" "/customers"

# /orders
$ordersId = Create-Resource $ROOT_ID "orders"
Create-Method $ordersId "GET" $true
Create-Integration $ordersId "GET"
Add-LambdaPermission "get-orders" "GET" "/orders"

# /orders/pricing
$pricingId = Create-Resource $ordersId "pricing"
Create-Method $pricingId "GET" $true
Create-Integration $pricingId "GET"
Add-LambdaPermission "get-pricing" "GET" "/orders/pricing"
Create-Method $pricingId "POST" $true
Create-Integration $pricingId "POST"
Add-LambdaPermission "save-pricing" "POST" "/orders/pricing"

# /orders/{orderId}
$orderIdId = Create-Resource $ordersId "{orderId}"
Create-Method $orderIdId "GET" $true
Create-Integration $orderIdId "GET"
Add-LambdaPermission "get-order" "GET" "/orders/{orderId}"

# /orders/{orderId}/quote
$quoteId = Create-Resource $orderIdId "quote"
Create-Method $quoteId "POST" $true
Create-Integration $quoteId "POST"
Add-LambdaPermission "log-quote" "POST" "/orders/{orderId}/quote"

# /profile
$profileId = Create-Resource $ROOT_ID "profile"
Create-Method $profileId "GET" $true
Create-Integration $profileId "GET"
Add-LambdaPermission "get-profile" "GET" "/profile"
Create-Method $profileId "PUT" $true
Create-Integration $profileId "PUT"
Add-LambdaPermission "update-profile" "PUT" "/profile"

# /calendar
$calendarId = Create-Resource $ROOT_ID "calendar"
# /calendar/confirm
$confirmId = Create-Resource $calendarId "confirm"
Create-Method $confirmId "POST" $true
Create-Integration $confirmId "POST"
Add-LambdaPermission "confirm-booking" "POST" "/calendar/confirm"

# /calendar/decline
$declineId = Create-Resource $calendarId "decline"
Create-Method $declineId "POST" $true
Create-Integration $declineId "POST"
Add-LambdaPermission "decline-order" "POST" "/calendar/decline"

# /calendar/auth-url
$authUrlId = Create-Resource $calendarId "auth-url"
Create-Method $authUrlId "GET" $true
Create-Integration $authUrlId "GET"
Add-LambdaPermission "get-auth-url" "GET" "/calendar/auth-url"

# /calendar/callback (PUBLIC - no auth)
$callbackId = Create-Resource $calendarId "callback"
Create-Method $callbackId "GET" $false
Create-Integration $callbackId "GET"
Add-LambdaPermission "calendar-callback" "GET" "/calendar/callback"

# /web-intake (PUBLIC - no auth)
$webIntakeId = Create-Resource $ROOT_ID "web-intake"
Create-Method $webIntakeId "POST" $false
Create-Integration $webIntakeId "POST"
Add-LambdaPermission "web-intake" "POST" "/web-intake"

# Step 4: Deploy the API
Write-Host "Deploying API to 'prod' stage..."
aws apigateway create-deployment --rest-api-id $API_ID --region $REGION --stage-name prod | Out-Null

Write-Host ""
Write-Host "✅ Done! Your API Invoke URL is:"
Write-Host "https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

import json
import logging
import boto3
from time import gmtime, strftime
import base64

logger = logging.getLogger()
s3 = boto3.client('s3')

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('RecipesinProgressDynamoTable')
now = strftime("%a, %d %b %Y %H:%M", gmtime())

recipe_path = '/Recipe'
recipes_path = '/Recipes'

def lambda_handler(event, context):

    httpMethod = event['httpMethod']
    path = event['path']
    
    if httpMethod == 'POST' :
        response = postResponse(event)

    elif httpMethod == 'GET' and path == recipes_path:
        response = getRecipes()

    elif httpMethod == 'DELETE' and path == recipe_path:
        recipe_id = event['queryStringParameters']['ID']
        response = deleteResponse(recipe_id)
    
    else:
        response = buildResponse(400, 'Unsupported HTTP method')

    return response

def postResponse(event):
    requestBody = json.loads(event['body'])

    unique_id       = requestBody['ID']
    name            = requestBody['name']
    link            = requestBody['link']
    
    putResponse = table.put_item(
        Item={
            'ID': unique_id,
            'name': name,
            'link': link,
            'created': now
        })

    response = buildResponse(200, putResponse)

    return response

    
def deleteResponse(recipe_id):
    # Delete the item from DynamoDB
    table.delete_item(
        Key={'ID': recipe_id},
        ReturnValues='ALL_OLD'
    )

    # Build and return the response
    response = buildResponse(200, recipe_id)
    return response

def getRecipes():
    # If it's a GET request, retrieve data from DynamoDB
    response = table.scan()

    # Extract the relevant data from the response
    items = response.get('Items', [])

    response = buildResponse(200, items)
    return response

def buildResponse(statusCode, body=None):

    response =  {
            'statusCode': statusCode,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    if body is not None:
        response['body'] = json.dumps(body)
    return response
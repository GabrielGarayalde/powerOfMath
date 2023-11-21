import json
import logging
import boto3
import uuid
from time import gmtime, strftime
logger = logging.getLogger()

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('powerOfMathDynamoTable')
now = strftime("%a, %d %b %Y %H:%M", gmtime())

recipe_path = '/Recipe'
recipes_path = '/Recipes'

def lambda_handler(event, context):

    httpMethod = event['httpMethod']
    path = event['path']

    if httpMethod == 'POST' :
        response = postResponse(event)

    elif httpMethod == 'GET' and path == recipe_path:
        recipe_id = event['queryStringParameters']['ID']
        response = getRecipe(recipe_id)

    elif httpMethod == 'GET' and path == recipes_path:
        response = getRecipes()

    elif httpMethod == 'DELETE' and path == recipe_path:
        recipe_id = event['queryStringParameters']['ID']
        response = deleteResponse(recipe_id)

    elif httpMethod == 'PATCH' and path == recipe_path:
        recipe_id = event['queryStringParameters']['ID']
        body = json.loads(event['body'])
        response = patchRecipe(recipe_id, body['name'], body['ingredients'], body['instructions'])
    else:
        response = buildResponse(400, 'Unsupported HTTP method')

    return response

def patchRecipe(ID, new_name, new_ingredients, new_instructions):
    try:
        response = table.update_item(
            Key={'ID': ID},
            UpdateExpression='SET #nam = :nam, ingredients = :ing, instructions = :inst',
            ExpressionAttributeValues={
                ':nam': new_name,
                ':ing': new_ingredients,
                ':inst': new_instructions
            },
            ExpressionAttributeNames={
                '#nam': 'name'  # Map #nam to the attribute 'name'
            },
            ReturnValues='UPDATED_NEW'
        )

        body = {
            'Operation': 'UPDATE',
            'Message': 'SUCCESS',
            'UpdatedAttributes': response
        }
        return buildResponse(200, body)
        
    except Exception as e:
        logger.error("Error patching item in DynamoDB: %s", e)
        return buildResponse(500, "Internal Server Error"  + str(e))
    

def postResponse(event):
    requestBody = json.loads(event['body'])

    name = requestBody['name']
    ingredients = requestBody['ingredients']
    instructions = requestBody['instructions']

    unique_id = str(uuid.uuid4())[:8]

    putResponse = table.put_item(
        Item={
            'ID': unique_id,
            'name': name,
            'ingredients': ingredients,
            'instructions': instructions,
            'created': now
        })

    response = buildResponse(200, putResponse)

    return response

def deleteResponse(name):
    
    deleteResponse = table.delete_item(
    Key={
            'ID': name
        },
        ReturnValues='ALL_OLD'
    )
    
    response = buildResponse(200, name)

    return response


def getRecipe(recipeID):
    # Retrieve data from DynamoDB using the get_item method
    try:
        response = table.get_item(Key={'ID': recipeID})
    except Exception as e:
        logger.error("Error getting item from DynamoDB: %s", e)
        return buildResponse(500, "Internal Server Error")

    # Check if the item exists
    item = response.get('Item')
    if not item:
        return buildResponse(404, "Recipe not found")

    # Return the found item
    return buildResponse(200, item)



def getRecipes():
    # If it's a GET request, retrieve data from DynamoDB
    response = table.scan()

    # Extract the relevant data from the response
    items = response.get('Items', [])
    # items = response['Check']
    # Extract all values under the 'ID' attribute
    ids = [item['ID'] for item in items]

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
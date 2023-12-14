import json
import logging
import boto3
import uuid
from time import gmtime, strftime
from PIL import Image
import io
import base64

from botocore.exceptions import ClientError

logger = logging.getLogger()
s3 = boto3.client('s3')

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('powerOfMathDynamoTable')
now = strftime("%a, %d %b %Y %H:%M", gmtime())

like_path = '/Like'
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
        response = patchRecipe(recipe_id, body['name'], body['ingredients'], body['quote'], body['instructions'])

    elif httpMethod == 'PATCH' and path == like_path:
        recipe_id = event['queryStringParameters']['ID']
        body = json.loads(event['body'])
        # response = buildResponse(200, body['like'])
        response = patchLike(recipe_id, body['like'])
    
    else:
        response = buildResponse(400, 'Unsupported HTTP method')

    return response

def patchRecipe(ID, new_name, new_ingredients, new_quote, new_instructions):
    try:
        response = table.update_item(
            Key={'ID': ID},
            UpdateExpression='SET #nam = :nam, ingredients = :ing, quote = :quote, instructions = :inst',
            ExpressionAttributeValues={
                ':nam': new_name,
                ':ing': new_ingredients,
                ':quote': new_quote,
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
        return buildResponse(500, "Internal1 Server Error"  + str(e))

def patchLike(ID, new_like):
    try:
        response = table.update_item(
            Key={'ID': ID},
            UpdateExpression='SET #lik = :lik',
            ExpressionAttributeValues={
                ':lik': new_like
            },
            ExpressionAttributeNames={
                '#lik': 'like'  # Map #nam to the attribute 'name'
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
        return buildResponse(500, "Internal1 Server Error"  + str(e))

def postResponse(event):
    requestBody = json.loads(event['body'])

    unique_id       = requestBody['ID']
    name            = requestBody['name']
    ingredients     = requestBody['ingredients']
    quote           = requestBody['quote']
    instructions    = requestBody['instructions']

    putResponse = table.put_item(
        Item={
            'ID': unique_id,
            'name': name,
            'ingredients': ingredients,
            'quote': quote,
            'instructions': instructions,
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

    # Construct the S3 key for the recipe's image
    s3_key = f"{recipe_id}.jpg"  # Adjust the file extension if necessary

    # Delete the image from S3
    try:
        s3.delete_object(Bucket='recipe-bucket-anna', Key=s3_key)
        
    except Exception as e:
        print(f"Error deleting image from S3: {str(e)}")
        # Optionally handle the error (e.g., logging, returning an error response)

    # Build and return the response
    response = buildResponse(200, recipe_id)
    return response

    
def getRecipe(recipe_id):

    # Retrieve the specific recipe from DynamoDB
    try:
        response = table.get_item(Key={'ID': recipe_id})
    except Exception as e:
        print(f"Error retrieving recipe from DynamoDB: {str(e)}")
        return buildResponse(500, {"message": "Error retrieving recipe"})

    item = response.get('Item', None)
    if not item:
        return buildResponse(404, {"message": "Recipe not found"})

   

    s3_key1 = f"{recipe_id}_1.jpg"
    s3_key2 = f"{recipe_id}_2.jpg"
        
    try:
        fileObj1 = s3.get_object(Bucket='recipe-bucket-anna', Key=s3_key1)
        file_content1 = fileObj1["Body"].read()
        encoded_content1 = base64.b64encode(file_content1).decode('utf-8')

        fileObj2 = s3.get_object(Bucket='recipe-bucket-anna', Key=s3_key2)
        file_content2 = fileObj2["Body"].read()
        encoded_content2 = base64.b64encode(file_content2).decode('utf-8')

        item['image1'] = encoded_content1
        item['image2'] = encoded_content2
        
    except Exception as e:
        print(f"Error fetching image from S3 for {s3_key1}: {str(e)}")
    #     Handle missing images or other errors - perhaps by setting a default image or flag

    # Construct the response body with the single recipe
    response = buildResponse(200, item)
    return response
    
def getRecipes():
    # If it's a GET request, retrieve data from DynamoDB
    response = table.scan()

    # Extract the relevant data from the response
    items = response.get('Items', [])

    # Iterate over each item to fetch the corresponding image from S3
    for item in items:
        # Construct the S3 key based on the item's ID
        s3_key1 = f"{item['ID']}_1.jpg"
        s3_key2 = f"{item['ID']}_2.jpg"
        
        try:
            fileObj1 = s3.get_object(Bucket='recipe-bucket-anna', Key=s3_key1)
            file_content1 = fileObj1["Body"].read()
            encoded_content1 = base64.b64encode(file_content1).decode('utf-8')
    
            fileObj2 = s3.get_object(Bucket='recipe-bucket-anna', Key=s3_key2)
            file_content2 = fileObj2["Body"].read()
            encoded_content2 = base64.b64encode(file_content2).decode('utf-8')

            item['image1'] = encoded_content1
            item['image2'] = encoded_content2
            
        except Exception as e:
            print(f"Error fetching image from S3 for {s3_key1}: {str(e)}")
        

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
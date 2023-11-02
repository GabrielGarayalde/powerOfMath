import json
import math
import boto3
from time import gmtime, strftime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('powerOfMathDynamoTable')
now = strftime("%a, %d %b %Y %H:%M:%S +0000", gmtime())

def lambda_handler(event, context):

    httpMethod = event['httpMethod']
    if httpMethod == 'POST':
        response = postResponse(event)
        return response

    elif httpMethod == 'GET':
            response = getResponse(event)
            return response
    else:
        buildResponse(400, 'Unsupported HTTP method')



def postResponse(event):
    # If it's a POST request, perform the math calculation and store the result in DynamoDB
    base = int(event['queryStringParameters']['base'])
    exponent = int(event['queryStringParameters']['exponent'])
    math_result = math.pow(base, exponent)

    putResponse = table.put_item(
        Item={
            'ID': str(math_result),
            'Check': True
        })

    response = buildResponse(200, 'Your result is ' + str(math_result))

    return response

def getResponse(event):
    # If it's a GET request, retrieve data from DynamoDB
    response = table.scan()

    # Extract the relevant data from the response
    items = response.get('Items', [])
    # items = response['Check']
    # Extract all values under the 'ID' attribute
    ids = [item['ID'] for item in items]

    response = buildResponse(200, ids)

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
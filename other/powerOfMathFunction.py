import json
import math
import boto3
from time import gmtime, strftime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('powerOfMathDynamoTable')
now = strftime("%a, %d %b %Y %H:%M:%S +0000", gmtime())

def lambda_handler(event, context):
    if event['httpMethod'] == 'POST':
        # If it's a POST request, perform the math calculation and store the result in DynamoDB
        base = int(event['queryStringParameters']['base'])
        exponent = int(event['queryStringParameters']['exponent'])
        math_result = math.pow(base, exponent)

        response = table.put_item(
            Item={
                'ID': str(math_result),
                'LatestGreetingTime': now
            })

        return {
            'statusCode': 200,
            'body': json.dumps('Your result is ' + str(math_result))
        }
    elif event['httpMethod'] == 'GET':
        # If it's a GET request, retrieve data from DynamoDB
        response = table.scan()

        # Extract the relevant data from the response
        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'body': json.dumps(items)
        }
    else:
        return {
            'statusCode': 400,
            'body': json.dumps('Unsupported HTTP method')
        }

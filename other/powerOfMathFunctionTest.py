import json
import math

def lambda_handler(event, context):

    httpMethod = event['httpMethod']
    if httpMethod == 'POST':
        response = postResponse(event)
        return response

    else:
        buildResponse(400, 'Unsupported HTTP method')



def postResponse(event):
    request_body = json.loads(event['body'])
    base = request_body['base']
    exponent = request_body['exponent']

    # base = int(event['queryStringParameters']['base'])
    # exponent = int(event['queryStringParameters']['exponent'])
    math_result = math.pow(base, exponent)

    response = buildResponse(200, 'Your result is ' + str(math_result))

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
import base64
import boto3
from botocore.exceptions import ClientError
import json

s3 = boto3.client('s3')

def lambda_handler(event, context):
    http_method = event["httpMethod"]
    bucket_name = event["pathParameters"]["bucket"]

    if http_method == 'GET':
        # Handling GET request to fetch an image from S3
        file_name = event["queryStringParameters"]["ID"]
        
        
        try:
            fileObj = s3.get_object(Bucket=bucket_name, Key=file_name)
            file_content = fileObj["Body"].read()
            encoded_content = base64.b64encode(file_content).decode('utf-8')

            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",  # Adjust as needed
                    "Content-Disposition": "attachment; filename={}".format(file_name)
                },
                "body": json.dumps({"image": encoded_content})
            }
        except ClientError as e:
            return {
                "statusCode": e.response['ResponseMetadata']['HTTPStatusCode'],
                "body": str(e)
            }
        
        


    elif http_method == 'POST':
        file_name = event["queryStringParameters"]['ID']

        image_data = base64.b64decode(event["body"])
        content_type = 'image/jpeg'  # Default content type
        
        if file_name.lower().endswith('.png'):
            content_type = 'image/png'
        elif file_name.lower().endswith('.jpg') or file_name.lower().endswith('.jpeg'):
            content_type = 'image/jpeg'        
      



        try:

            s3.put_object(Bucket=bucket_name, Key=file_name, Body=image_data, ContentType=content_type)
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*"
                    
                },  # Adjust as needed
                "body": f"File {file_name} uploaded successfully to {bucket_name}."
            }
        except ClientError as e:
            return {
                "statusCode": e.response['ResponseMetadata']['HTTPStatusCode'],
                "body": str(e)
            }

    else:
        # HTTP method not supported
        return {
            "statusCode": 405,
            "body": "Method Not Allowed"
        }



import json
import base64
import boto3
from PIL import Image
import io

from botocore.exceptions import ClientError

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


        # TEST TO SEE WHETHER IT CAN OPEN AN EXISTING IMAGE AND RESAVE IT
        bucket_name = 'recipe-bucket-anna'  # Replace with your bucket name
        file = 'test.jpg'  # Replace with your image file name
        fileObj = s3.get_object(Bucket=bucket_name, Key=file)
        file_content = fileObj["Body"].read() #THIS IS IN A BINARY FORMAT
        
        
        
        
        image = Image.open(io.BytesIO(file_content))
        image = image.resize((image.size[0] // 2, image.size[1] // 2))

        # # Convert back to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')  # Adjust format as needed
        img_byte_arr = img_byte_arr.getvalue()

        # encoded_content = base64.b64encode(image_data).decode('utf-8')

        try:
            s3.put_object(Bucket=bucket_name, Key=file_name, Body=img_byte_arr, ContentType=content_type)

            # s3.put_object(Bucket=bucket_name, Key='pillow-function_resized_' + file_name, Body=img_byte_arr, ContentType='image/jpeg')

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



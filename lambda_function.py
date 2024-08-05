## this is the new lambda function that uploads also a smaller thumbnail photo



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
            fileObj1 = s3.get_object(Bucket=bucket_name, Key=file_name+"_1")
            file_content1 = fileObj1["Body"].read()
            encoded_content1 = base64.b64encode(file_content1).decode('utf-8')

            fileObj2 = s3.get_object(Bucket=bucket_name, Key=file_name+"_2")
            file_content2 = fileObj2["Body"].read()
            encoded_content2 = base64.b64encode(file_content2).decode('utf-8')
            
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",  # Adjust as needed
                    "Content-Disposition": "attachment; filename={}".format(file_name)
                },
                "body": json.dumps({
                    "image1": encoded_content1,
                    "image2": encoded_content2,
                })
            }
        except ClientError as e:
            return {
                "statusCode": e.response['ResponseMetadata']['HTTPStatusCode'],
                "body": str(e)
            }
        
        
    elif http_method == 'POST':
        file_name = event["queryStringParameters"]['ID']
        # file_name = "test2.jpg"

        image_data = base64.b64decode(event["body"])
        
         # Load the image using PIL
        image = Image.open(io.BytesIO(image_data))
        
        # Detect the image format
        image_format = image.format  # This will be 'JPEG', 'PNG', etc.
        content_type = f'image/{image_format.lower()}'

        # Our Large image goes first
        # Resize the image
        image_Lg = image.resize((image.size[0] // 2, image.size[1] // 2))

        # Convert back to bytes
        img_byte_arr_Lg = io.BytesIO()
        image_Lg.save(img_byte_arr_Lg, format=image_format)
        img_byte_arr_Lg = img_byte_arr_Lg.getvalue()


        # Then our thumbnail
        # Resize the image
        image_Sm = image.resize((image.size[0] // 8, image.size[1] // 8))

        # Convert back to bytes
        img_byte_arr_Sm = io.BytesIO()
        image_Sm.save(img_byte_arr_Sm, format=image_format)
        img_byte_arr_Sm = img_byte_arr_Sm.getvalue()

        try:
            s3.put_object(Bucket=bucket_name, Key=file_name, Body=img_byte_arr_Lg, ContentType=content_type)
            s3.put_object(Bucket=bucket_name, Key=file_name + "_Sm", Body=img_byte_arr_Sm, ContentType=content_type)

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



from cloud_storage import storage

with open("test.jpg", "rb") as f:
    url = storage.upload_image(f.read(), "test.jpg")
    print("上传结果:", url)

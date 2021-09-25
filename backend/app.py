from flask import Flask, jsonify, request
from dotenv import load_dotenv
from pymongo import MongoClient
from flask_cors import CORS
import os

load_dotenv()
client = MongoClient(os.environ["DB_URL"])

db = client.QuickApply

app = Flask(__name__)
CORS(app)

@app.route("/application", methods=["GET"])
def get_applications():
    applications = db.applications
    app_list = []
    for app in applications.find():
        app_list.append(app)
    return jsonify(app_list)


@app.route("/application/email", methods=["POST"])
def post_application_email():
    email = request.args.get("email")
    application = db.applications.insert_one({"email": email})
    return {"id":str(application.inserted_id)}, 200

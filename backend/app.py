from flask import Flask, jsonify, request
from dotenv import load_dotenv
from pymongo import MongoClient
from flask_cors import CORS
import os
from bson import ObjectId
from collections import Counter
import math
import numpy as np
from numpy import linalg as LA

import pytesseract
from pdf2image import convert_from_bytes
import glob

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


load_dotenv()
client = MongoClient(os.environ["DB_URL"])

db = client.QuickApply

app = Flask(__name__)
CORS(app)

# compute Term frequency of a specific term in a document
def termFrequency(term, document):
    normalizeDocument = document.lower().split()
    return normalizeDocument.count(term.lower()) / float(len(normalizeDocument))

# IDF of a term
def inverseDocumentFrequency(term, documents):
    count = 0
    for doc in documents:
        if term.lower() in doc.lower().split():
            count += 1
    if count > 0:
        return 1.0 + math.log(float(len(documents))/count)
    else:
        return 1.0
        
# tf-idf of a term in a document
def tf_idf(term, document, documents):
    tf = termFrequency(term, document)
    idf = inverseDocumentFrequency(term, documents)
    return tf*idf

@app.route("/application", methods=["GET"])
def get_applications():
    applications = db.applications
    app_list = []
    for app in applications.find():
        app_list.append(app)
    return jsonify(app_list)

@app.route("/application/<id>", methods=["PUT"])
def modify_application(id):
    print(id, request.json)
    db.applications.update_one({'_id': ObjectId(id)}, {"$set": request.json}, upsert=False)
    return "Updated succesfully", 200

@app.route("/application/<id>/finish", methods=["POST"])
def submit_application(id):
    db.applications.update_one({'_id': ObjectId(id)}, {"$set": {"status":"submitted"}}, upsert=False)
    app = db.applications.find_one({'_id': ObjectId(id)})
    message = Mail(
    from_email='haggyy@vcu.edu',
    to_emails=app["email"],
    subject=f'Your {app["role"]} application to XYZ company has been received',
    html_content=f"<p>Hello {app['name']}, we've received your {app['role']} application</p>")
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)
    except Exception as e:
        print(e.message)
    return "Submitted succesfully", 200


def convert_to_txt(pdf):
    pages = convert_from_bytes(pdf.read(), 300)
    for pageNum,imgBlob in enumerate(pages):
        text = pytesseract.image_to_string(imgBlob,lang='eng')
        return {"text":text}, 200

@app.route("/text-from-pdf", methods=["POST"])
def get_text_from_pdf():
    file = request.files['file']
    return convert_to_txt(file)

@app.route("/role", methods=["GET"])
def get_roles():
    user_description = request.args.get("description")
    roles= []
    for role in db.roles.find():
        roles.append(role)
    
    # TODO: Lemmatize
    # lemmatizer = WordNetLemmatizer()

    # https://ted-mei.medium.com/demystify-tf-idf-in-indexing-and-ranking-5c3ae88c3fa0
    def generateVectors(query, documents):
        tf_idf_matrix = np.zeros((len(query.split()), len(documents)))
        for i, s in enumerate(query.lower().split()):
            idf = inverseDocumentFrequency(s, documents)
            for j,doc in enumerate(documents):
                tf_idf_matrix[i][j] = idf * termFrequency(s, doc)
        return tf_idf_matrix
        
    tf_idf_matrix = generateVectors(user_description, [role["description"] for role in roles])

    def word_count(s):
        counts = dict()
        words = s.lower().split()
        for word in words:
            if word in counts:
                counts[word] += 1
            else:
                counts[word] = 1
        return counts
    def build_query_vector(query, documents):
        count = word_count(query)
        print(count)
        vector = np.zeros((len(query.lower().split()),1))
        for i, word in enumerate(query.lower().split()):
            vector[i][0] = float(count[word])/len(count) * inverseDocumentFrequency(word, documents)
        return vector
        
    query_vector = build_query_vector(user_description, [role["description"] for role in roles])

    def consine_similarity(v1, v2):
        return np.dot(v1,v2)/float(LA.norm(v1)*LA.norm(v2))

    def compute_relevance(query, documents):
        docs_with_relevance = []
        for i, doc in enumerate(documents):
            similarity = consine_similarity(tf_idf_matrix[:,i].reshape(1, len(tf_idf_matrix)), query_vector)
            docs_with_relevance.append({"id":str(documents[i]["_id"]), "title": documents[i]["title"], "similarity":float(similarity[0]) if not math.isnan(similarity[0]) else 0})
        return sorted(docs_with_relevance, key=lambda doc: doc["similarity"], reverse=True)
    
    return jsonify(compute_relevance(user_description, roles))
            
    

@app.route("/application/start", methods=["POST"])
def post_application_email():
    email = request.args.get("email")
    application = db.applications.insert_one({"email": email})
    return {"id":str(application.inserted_id)}, 200

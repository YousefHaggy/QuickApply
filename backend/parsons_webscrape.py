import requests
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

client = MongoClient(os.environ["DB_URL"])
db = client.QuickApply

starting_job_id = 13961200
url = "https://jobs.parsons.com/job/" 

description_div_id = "gtm-jobdetail-desc"
title_id ="gtm-jobdetail-title"

titles = set()
job_ids= ["13963021","13383163","13301787","13961527","13961528","13961526","13961525","13961524","13961523","13961522","13961521","13961520","13961519","13961518","13961517","13961516","13961515","13955060","13955059","13955058","13955057","13955056","13955055","13953288","13953287","13953286","13953285","13949547","13818963","13945441","13945440","13943614","13943613","13943612","13943611","13712873","13939067","13939066","13939065","13939064","13939062","13620561","13087293","13708748","13843637","13083467","13936822","13936821","13936820","13936819","13936818","13936817","13106549","13845109","13619133","13932248","13932247","13932246","13932245","13932244","13932243","13932242","13932241","13932240","13932239","13808697","13930398","13930397","13930396","13930395","13930394","13928309","13928308","13928306","13928303","13105965","11898584","11915753","13900918","13925277","13925275","13925273","13843636","13797232","12975539","13677462","13921321","13921320","13921319","13921318","13921317","13921315","13536290","13507989","13797236","13917015"]
# for i in range(0,100):
for id in job_ids:
    page = requests.get(url+id)
    soup = BeautifulSoup(page.content, "html.parser")

    title = soup.find(id=title_id).text
    if title in titles:
        continue
    titles.add(title)
    description = soup.find(id=description_div_id).text
    print(title,description)

    db.roles.insert_one({"title":title, "description":description})



'''
This file explicitly defines the models for our collections and their embedded fields.
It provides default values where necessary and links to the database.

Authors: Brian Gunnarson, Sam Peters, and Alec Springel
Group Name: 5 Bits in a Byte

Last Modified Date: 03/12/2021
'''
from inquire.config import MONGO_URI

from pymodm import MongoModel, fields, EmbeddedMongoModel
from pymongo.write_concern import WriteConcern
from pymodm.connection import connect
import pymongo
import json
import shortuuid
import datetime
from bson.objectid import ObjectId


class User(MongoModel):
    _id = fields.CharField(primary_key=True)
    anonymousId = fields.CharField(required=True, default=ObjectId)
    email = fields.EmailField(blank=True)
    first = fields.CharField(default="Nofirstgiven", blank=True)
    last = fields.CharField(default="Nolastgiven", blank=True)
    picture = fields.URLField()
    courses = fields.EmbeddedDocumentListField(
        'UserCourse', blank=True, required=True)

    def get_course(self, courseId):
        for course in self.courses:
            if course.courseId == courseId:
                return course
        return None

    class Meta:
        write_concern = WriteConcern(j=True)
        connection_alias = 'my-app'

        indexes = [pymongo.IndexModel([('_id', pymongo.ASCENDING)]), pymongo.IndexModel([
            ('anonymousId', pymongo.ASCENDING)], unique=True)]


class UserCourse(EmbeddedMongoModel):
    courseId = fields.CharField()
    courseName = fields.CharField(required=True)
    nickname = fields.CharField(blank=True)
    color = fields.CharField(blank=True)
    canPost = fields.BooleanField(default=True)
    seePrivate = fields.BooleanField(default=False)
    canPin = fields.BooleanField(default=False)
    canRemove = fields.BooleanField(default=False)
    canEndorse = fields.BooleanField(default=False)
    viewAnonymous = fields.BooleanField(default=False)
    admin = fields.BooleanField(default=False)


'''
Posts use the Course ID to reference the course they belong to.

Although it may seem sensible to attach user references to the course,
it is also unnecessary. Each user's document will contain the courses
they belong to, and their permissions for each course. By storing the
permissions in a single place (the User model), we eliminate the need
to modify/query multiple documents when updating classes or permissions.
'''


class Post(MongoModel):
    _id = fields.CharField(primary_key=True, default=ObjectId)
    courseId = fields.CharField()
    postedBy = fields.DictField()
    title = fields.CharField(required=True)
    content = fields.CharField(required=True)
    isInstructor = fields.BooleanField(default=False)
    isPinned = fields.BooleanField(default=False)
    isPrivate = fields.BooleanField()
    instructorCommented = fields.BooleanField(default=False)
    reactions = fields.DictField(default={"likes": []})
    comments = fields.IntegerField(default=0)
    createdDate = fields.DateTimeField(default=datetime.datetime.now)
    updatedDate = fields.DateTimeField(default=datetime.datetime.now)

    def serialize(self, date):
        pass

    class Meta:
        write_concern = WriteConcern(j=True)
        connection_alias = 'my-app'

        indexes = [pymongo.IndexModel([('$**', pymongo.TEXT)])]


class Comment(MongoModel):
    postId = fields.CharField(required=True)
    content = fields.CharField(required=True, default="")
    postedBy = fields.DictField()
    endorsed = fields.BooleanField(default=False)
    replies = fields.EmbeddedDocumentListField('Reply', blank=True)
    reactions = fields.DictField(default={'likes': []})

    class Meta:
        write_concern = WriteConcern(j=True)
        connection_alias = 'my-app'


class Reply(EmbeddedMongoModel):
    _id = fields.CharField(primary_key=True, default=ObjectId)
    content = fields.CharField(required=True, default="")
    postedBy = fields.DictField()
    reactions = fields.DictField(default={'likes': []})


class Course(MongoModel):
    # university = fields.CharField()
    course = fields.CharField()
    canJoinById = fields.BooleanField()
    instructorID = fields.CharField()
    _id = fields.CharField(primary_key=True, default=shortuuid.uuid)

    class Meta:
        write_concern = WriteConcern(j=True)
        connection_alias = 'my-app'

        indexes = [pymongo.IndexModel([('$**', pymongo.TEXT)])]
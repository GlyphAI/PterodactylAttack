#!/usr/bin/python

import os
import zipfile
import shutil
import subprocess
import re

def get_all_js_includes(filename):
	pattern = re.compile(r'\s*<script src="(.*)"></script>')
	includes = []
	with open(filename) as f:
		for line in f:
			m = pattern.match(line)
			if m:
				includes.append(m.group(1))
	return includes

# Concatenate files into a single file (unix cat util)
def cat(in_names,out_name):
	destination = open(out_name,'wb')
	for filename in in_names:
		shutil.copyfileobj(open(filename,'rb'), destination)
	destination.close()

# Create zip file.
def create_zip(in_names,out_name):
	archive = zipfile.ZipFile(out_name,'w')
	def addFile(filename):
		archive.write(filename)
		print "   " + filename

	def addDir(dirname):
		for dirpath,subdirs,files in os.walk(dirname):
			for f in files:
				addFile(os.path.join(dirpath,f))
	for filename in in_names:
		if os.path.isdir(filename):
			addDir(filename)
		else:
			addFile(filename)
	archive.close()

if __name__ == "__main__":
	print "Creating remote.js ..."
	includes = get_all_js_includes("remote.html")
	for i in includes:
		print "   " + i
	cat(includes, 'remote.js')
	print "done."


	print "Creating remote.zip ..."
	create_zip(['remote.js','layout/remote.json','img/net_01.png','img/net_01.png.json'], 'remote.zip')
	print "done."


	"""
	print "Copying to android device ..."
	try:
		subprocess.call(["adb","push","cocoon.zip","/sdcard/"])
	except:
		print "	ERROR: couldn't copy to android device"
	"""

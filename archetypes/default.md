+++
date = '{{ .Date }}'
years = ['{{ dateFormat "2006" .Date }}']
draft = false
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
tags = []
+++

#!/usr/bin/env bash
aws ses send-templated-email --cli-input-json file://myemail.json

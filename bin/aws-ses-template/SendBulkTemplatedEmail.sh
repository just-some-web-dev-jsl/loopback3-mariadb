#!/usr/bin/env bash
aws ses send-bulk-templated-email --cli-input-json file://mybulkemail.json

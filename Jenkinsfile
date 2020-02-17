#!groovy

// Jenkinsfile (Scripted Pipeline)

// def MAIL_FROM = "no-reply@b2link.co.kr"
// def MAIL_REPLYTO = "no-reply@b2link.co.kr"
// def MAIL_TO = "jaehyun@b2link.co.kr"

node {
  currentBuild.result = "SUCCESS"

  withEnv(['NODE_ENV=development']) {
    try {
      stage('Checkout'){
        checkout scm
      }

      stage('Setup NodeJs'){
        env.NODE_HOME = "${tool 'node 12'}"
        env.PATH = "${env.NODE_HOME}/bin:${env.PATH}"
        sh 'node -v'
        sh 'npm -v'
      }

      stage('Build') {
        echo "Environment will be : ${env.NODE_ENV}"
        // sh 'npm ci --only=prod'
        // sh 'npm install --only=prod'
        sh 'npm install'
        sh 'npm prune'
      }

      stage('Test') {
        // sh 'npm ci --only=dev'
        // sh 'npm install --only=dev'
        // sh 'npm prune'

        echo "Run lint"
        sh 'npm run lint'

        echo "Run format"
        sh 'npm run format'

        echo "Run test"
        sh 'npm run test'

        if (env.CHANGE_ID) {
          def comment = pullRequest.comment('This PR is test successful.')
        }
      }

      // stage('Deploy') {
      //   echo "Deploy to AWS EC2"
      // }

      // stage('Cleanup') {
      //   echo "Cleanup"
      //   sh 'rm -rf node_modules'
      // }
    } catch (err) {
      currentBuild.result = "FAILURE"

      if (env.CHANGE_ID) {
        def comment = pullRequest.comment('This PR is test failed.')
      }

      // mail subject: 'project build failed',
      //   body: "project build error is here: ${env.BUILD_URL}",
      //   from: "${MAIL_FROM}",
      //   replyTo: "${MAIL_REPLYTO}",
      //   to: "${MAIL_TO}",

      throw err
    }
  }
}

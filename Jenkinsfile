pipeline {
    agent any
    
    environment {
        AWS_ACCOUNT_ID = sh(script: 'aws sts get-caller-identity --query Account --output text', returnStdout: true).trim()
        AWS_DEFAULT_REGION = "ap-south-1"
        IMAGE_REPO_NAME = "node-app"
        IMAGE_TAG = "${BUILD_NUMBER}"
        REPOSITORY_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${IMAGE_REPO_NAME}"
        ECS_CLUSTER = "node-app-cluster"
        ECS_SERVICE = "node-app-service"
        TASK_DEFINITION_NAME = "node-app-task"
    }
    
    stages {
        stage('Code Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/nainit-virtueinfo/nodejs-app',
                    credentialsId: 'github-credentials'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${env.IMAGE_REPO_NAME}:${env.IMAGE_TAG} ."
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                script {
                    sh """
                        aws ecr get-login-password --region ${env.AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_DEFAULT_REGION}.amazonaws.com
                        docker tag ${env.IMAGE_REPO_NAME}:${env.IMAGE_TAG} ${env.REPOSITORY_URI}:${env.IMAGE_TAG}
                        docker push ${env.REPOSITORY_URI}:${env.IMAGE_TAG}
                    """
                }
            }
        }
        
        stage('Deploy to ECS') {
            steps {
                script {
                    sh """
                        TASK_DEFINITION=\$(aws ecs describe-task-definition --task-definition ${env.TASK_DEFINITION_NAME} --region ${env.AWS_DEFAULT_REGION})
                        NEW_TASK_DEFINITION=\$(echo \$TASK_DEFINITION | jq --arg IMAGE "${env.REPOSITORY_URI}:${env.IMAGE_TAG}" '.taskDefinition | .containerDefinitions[0].image = \$IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities)')
                        NEW_TASK_INFO=\$(aws ecs register-task-definition --region ${env.AWS_DEFAULT_REGION} --cli-input-json "\$NEW_TASK_DEFINITION")
                        NEW_REVISION=\$(echo \$NEW_TASK_INFO | jq '.taskDefinition.revision')
                        aws ecs update-service --cluster ${env.ECS_CLUSTER} --service ${env.ECS_SERVICE} --task-definition ${env.TASK_DEFINITION_NAME}:\$NEW_REVISION --force-new-deployment --region ${env.AWS_DEFAULT_REGION}
                    """
                }
            }
        }
    }
    
    post {
        always {
            script {
                try {
                    def images = sh(script: 'docker images --format "{{.Repository}}:{{.Tag}}"', returnStdout: true).trim()
                    
                    if (images.contains("${env.IMAGE_REPO_NAME}:${env.IMAGE_TAG}")) {
                        sh "docker rmi ${env.IMAGE_REPO_NAME}:${env.IMAGE_TAG}"
                    }
                    
                    if (images.contains("${env.REPOSITORY_URI}:${env.IMAGE_TAG}")) {
                        sh "docker rmi ${env.REPOSITORY_URI}:${env.IMAGE_TAG}"
                    }
                    
                    sh "docker image prune -f"
                } catch (Exception e) {
                    echo "Warning: Cleanup failed but continuing pipeline: ${e.getMessage()}"
                }
            }
        }
        success {
            echo 'Successfully deployed to ECS!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
PROJECT_NAME=${1:-"myproject"}
IMAGE_PREFIX="$PROJECT_NAME"
MONGO_VOLUME="${PROJECT_NAME}_mongo-data"
NETWORK_NAME="${PROJECT_NAME}-net"

check_env_files() {
    local env=$1
    if [ "$env" == "development" ]; then
        if [ ! -f .env.development ]; then
            echo "Error: .env.development file not found! Please create this file."
            exit 1
        fi
        if [ ! -f docker-compose.dev.yml ]; then
            echo "Error: docker-compose.dev.yml file not found! Please create this file."
            exit 1
        fi
    elif [ "$env" == "production" ]; then
        if [ ! -f .env.production ]; then
            echo "Error: .env.production file not found! Please create this file."
            exit 1
        fi
        if [ ! -f docker-compose.prod.yml ]; then
            echo "Error: docker-compose.prod.yml file not found! Please create this file."
            exit 1
        fi
    fi
}

# Function to clean up containers, images, volumes, and network
cleanup() {
    local env=$1
    echo "Starting cleanup process for $PROJECT_NAME ($env environment)..."

    # Stop and remove containers
    docker stop mongo_container client server >/dev/null 2>&1
    docker rm mongo_container client server >/dev/null 2>&1

    # Remove images
    docker rmi $(docker images -q --filter "reference=${IMAGE_PREFIX}*") >/dev/null 2>&1

    # Remove volume and network
    docker volume rm $MONGO_VOLUME >/dev/null 2>&1
    docker network rm $NETWORK_NAME >/dev/null 2>&1

    echo "Cleanup complete."
}

# Function to start services
start_services() {
    local env=$1
    local services=$2

    if [ "$env" == "development" ]; then
        docker compose --project-name $PROJECT_NAME --env-file .env.development -f docker-compose.dev.yml up $services
    else
        docker compose --project-name $PROJECT_NAME --env-file .env.production -f docker-compose.prod.yml up -d $services
    fi
}

# Interactive menu function
show_menu() {
    echo "Environment:"
    echo "1) Development"
    echo "2) Production"
    echo "3) Exit"
    read -p "Choice [1-3]: " env_choice

    case $env_choice in
    1) ENV="development" ;;
    2) ENV="production" ;;
    3) exit 0 ;;
    *)
        echo "Invalid choice"
        return 1
        ;;
    esac

    check_env_files $ENV

    echo "Select service:"
    echo "1) All (Clean start)"
    echo "2) Server"
    echo "3) Client"
    echo "4) Server & Client"
    echo "5) Back"
    echo "6) Exit"
    echo "7) Clean server only"
    read -p "Choice [1-7]: " service_choice

    return 0
}

# Main script logic
if [ $# -eq 0 ]; then
    echo "Usage: ./setup.sh <project_name>"
    echo "No project name provided, using default: $PROJECT_NAME"
fi

while true; do
    show_menu
    [ $? -eq 1 ] && continue

    case $service_choice in
    1)
        cleanup $ENV
        start_services $ENV "--build --force-recreate"
        ;;
    2) start_services $ENV "server worker likeworker" ;;
    3) start_services $ENV "client" ;;
    4) start_services $ENV "server client" ;;
    5) continue ;;
    6) exit 0 ;;
    7) start_services $ENV "--build server";;
    *) echo "Invalid choice" ;;
    esac
    break
done
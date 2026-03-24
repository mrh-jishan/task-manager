require "test_helper"

class TasksFlowTest < ActionDispatch::IntegrationTest
  setup do
    Task.delete_all
  end

  test "creates shows updates and deletes a task" do
    post "/api/tasks", params: {
      task: {
        title: "Ship backend API",
        description: "Implement CRUD and search",
        status: "open",
        priority: "high"
      }
    }, as: :json

    assert_response :created

    task_id = response.parsed_body["id"]
    assert_equal "Ship backend API", response.parsed_body["title"]

    get "/api/tasks/#{task_id}", as: :json
    assert_response :success
    assert_equal task_id, response.parsed_body["id"]

    patch "/api/tasks/#{task_id}", params: {
      task: {
        status: "in_progress",
        priority: "urgent"
      }
    }, as: :json

    assert_response :success
    assert_equal "in_progress", response.parsed_body["status"]
    assert_equal "urgent", response.parsed_body["priority"]

    delete "/api/tasks/#{task_id}", as: :json
    assert_response :no_content
    assert_equal 0, Task.count
  end

  test "serves the task API under /api as well" do
    Task.create!(
      title: "Customer ticket",
      description: "Investigate missing export",
      status: "open",
      priority: "high"
    )

    get "/api/tasks", params: { q: "export" }

    assert_response :success
    assert_equal 1, response.parsed_body["data"].length
    assert_equal "Customer ticket", response.parsed_body["data"].first["title"]

    get "/api/up"
    assert_response :success
  end

  test "searches tasks with full text and fuzzy matching" do
    Task.create!(
      title: "Investigate payment failure",
      description: "Customer cannot complete checkout after invoice mismatch",
      status: "open",
      priority: "high"
    )
    Task.create!(
      title: "Prepare sprint retro",
      description: "Collect wins and blockers from the team",
      status: "open",
      priority: "medium"
    )

    get "/api/tasks", params: { q: "invoice checkout" }

    assert_response :success
    assert_equal 1, response.parsed_body["data"].length
    assert_equal "Investigate payment failure", response.parsed_body["data"].first["title"]
    assert_equal 1, response.parsed_body["pagination"]["total_count"]

    get "/api/tasks", params: { q: "chekout" }

    assert_response :success
    assert_equal "Investigate payment failure", response.parsed_body["data"].first["title"]
  end

  test "filters tasks by status" do
    Task.create!(title: "Todo item", status: "open", priority: "low")
    Task.create!(title: "Done item", status: "completed", priority: "medium")

    get "/api/tasks", params: { status: "completed" }

    assert_response :success
    assert_equal 1, response.parsed_body["data"].length
    assert_equal "completed", response.parsed_body["data"].first["status"]
  end

  test "paginates tasks" do
    3.times do |index|
      Task.create!(
        title: "Task #{index}",
        description: "Task number #{index}",
        status: "open",
        priority: "medium",
        updated_at: Time.current + index.minutes
      )
    end

    get "/api/tasks", params: { page: 2, per_page: 2 }

    assert_response :success
    assert_equal 1, response.parsed_body["data"].length
    assert_equal 2, response.parsed_body["pagination"]["page"]
    assert_equal 2, response.parsed_body["pagination"]["per_page"]
    assert_equal 3, response.parsed_body["pagination"]["total_count"]
    assert_equal 2, response.parsed_body["pagination"]["total_pages"]
  end

  test "caps per_page and normalizes invalid page values" do
    Task.create!(title: "Task", status: "open", priority: "low")

    get "/api/tasks", params: { page: 0, per_page: 999 }

    assert_response :success
    assert_equal 1, response.parsed_body["pagination"]["page"]
    assert_equal 100, response.parsed_body["pagination"]["per_page"]
  end

  test "returns validation errors for invalid create input" do
    post "/api/tasks", params: {
      task: {
        title: "   ",
        description: "x" * (Task::DESCRIPTION_MAX_LENGTH + 1),
        status: "open",
        priority: "medium"
      }
    }, as: :json

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Title can't be blank"
    assert_includes response.parsed_body["errors"], "Description is too long (maximum is #{Task::DESCRIPTION_MAX_LENGTH} characters)"
  end
end

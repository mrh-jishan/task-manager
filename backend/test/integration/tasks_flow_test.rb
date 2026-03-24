require "test_helper"

class TasksFlowTest < ActionDispatch::IntegrationTest
  setup do
    Task.delete_all
  end

  test "creates shows updates and deletes a task" do
    post tasks_path, params: {
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

    get task_path(task_id), as: :json
    assert_response :success
    assert_equal task_id, response.parsed_body["id"]

    patch task_path(task_id), params: {
      task: {
        status: "in_progress",
        priority: "urgent"
      }
    }, as: :json

    assert_response :success
    assert_equal "in_progress", response.parsed_body["status"]
    assert_equal "urgent", response.parsed_body["priority"]

    delete task_path(task_id), as: :json
    assert_response :no_content
    assert_equal 0, Task.count
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

    get tasks_path, params: { q: "invoice checkout" }, as: :json

    assert_response :success
    assert_equal 1, response.parsed_body.length
    assert_equal "Investigate payment failure", response.parsed_body.first["title"]

    get tasks_path, params: { q: "chekout" }, as: :json

    assert_response :success
    assert_equal "Investigate payment failure", response.parsed_body.first["title"]
  end

  test "filters tasks by status" do
    Task.create!(title: "Todo item", status: "open", priority: "low")
    Task.create!(title: "Done item", status: "completed", priority: "medium")

    get tasks_path, params: { status: "completed" }, as: :json

    assert_response :success
    assert_equal 1, response.parsed_body.length
    assert_equal "completed", response.parsed_body.first["status"]
  end
end

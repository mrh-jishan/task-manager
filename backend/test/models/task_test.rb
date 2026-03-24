require "test_helper"

class TaskTest < ActiveSupport::TestCase
  test "requires a title" do
    task = Task.new(status: "open", priority: "medium")

    assert_not task.valid?
    assert_includes task.errors[:title], "can't be blank"
  end

  test "requires a supported status" do
    task = Task.new(title: "Write docs", status: "invalid", priority: "medium")

    assert_not task.valid?
    assert_includes task.errors[:status], "is not included in the list"
  end

  test "strips whitespace-only titles and keeps them invalid" do
    task = Task.new(title: "   ", status: "open", priority: "medium")

    assert_not task.valid?
    assert_includes task.errors[:title], "can't be blank"
  end

  test "normalizes description whitespace" do
    task = Task.create!(
      title: "Write docs",
      description: "   ",
      status: "open",
      priority: "medium"
    )

    assert_nil task.description
  end

  test "rejects overly long titles" do
    task = Task.new(
      title: "a" * (Task::TITLE_MAX_LENGTH + 1),
      status: "open",
      priority: "medium"
    )

    assert_not task.valid?
    assert_includes task.errors[:title], "is too long (maximum is #{Task::TITLE_MAX_LENGTH} characters)"
  end
end

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
end

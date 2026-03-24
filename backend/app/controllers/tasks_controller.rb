class TasksController < ApplicationController
  before_action :set_task, only: %i[show update destroy]

  def index
    tasks = Task.search(params[:q]).with_status(params[:status])
    render json: tasks.map { |task| serialize_task(task) }
  end

  def show
    render json: serialize_task(@task)
  end

  def create
    task = Task.new(task_params)

    if task.save
      render json: serialize_task(task), status: :created
    else
      render_validation_errors(task)
    end
  end

  def update
    if @task.update(task_params)
      render json: serialize_task(@task)
    else
      render_validation_errors(@task)
    end
  end

  def destroy
    @task.destroy
    head :no_content
  end

  private

  def set_task
    @task = Task.find(params[:id])
  end

  def task_params
    params.expect(task: %i[title description status priority due_at completed_at])
  end

  def serialize_task(task)
    task.as_json(
      only: %i[id title description status priority due_at completed_at created_at updated_at]
    )
  end

  def render_validation_errors(task)
    render json: { errors: task.errors.full_messages }, status: :unprocessable_entity
  end
end

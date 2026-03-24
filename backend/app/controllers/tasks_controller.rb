class TasksController < ApplicationController
  DEFAULT_PAGE = 1
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  before_action :set_task, only: %i[show update destroy]

  def index
    tasks = Task.search(params[:q]).with_status(params[:status])
    page = current_page
    per_page = current_per_page
    total_count = tasks.except(:select, :order).count
    total_pages = (total_count.to_f / per_page).ceil

    paginated_tasks = tasks.offset((page - 1) * per_page).limit(per_page)

    render json: {
      data: paginated_tasks.map { |task| serialize_task(task) },
      pagination: {
        page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: total_pages
      }
    }
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

  def current_page
    [ params[:page].to_i, DEFAULT_PAGE ].max
  end

  def current_per_page
    requested_per_page = params[:per_page].to_i
    return DEFAULT_PER_PAGE if requested_per_page <= 0

    [ requested_per_page, MAX_PER_PAGE ].min
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

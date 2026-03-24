# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_24_003200) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pg_trgm"

  create_table "tasks", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "due_at"
    t.string "priority", default: "medium", null: false
    t.string "status", default: "open", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index "to_tsvector('simple'::regconfig, (((COALESCE(title, ''::character varying))::text || ' '::text) || COALESCE(description, ''::text)))", name: "index_tasks_on_search_vector", using: :gin
    t.index ["description"], name: "index_tasks_on_description_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["due_at"], name: "index_tasks_on_due_at"
    t.index ["priority"], name: "index_tasks_on_priority"
    t.index ["status"], name: "index_tasks_on_status"
    t.index ["title"], name: "index_tasks_on_title_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["updated_at"], name: "index_tasks_on_updated_at"
  end
end

class CreateTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :tasks do |t|
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: "open"
      t.string :priority, null: false, default: "medium"
      t.datetime :due_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :tasks, :status
    add_index :tasks, :priority
    add_index :tasks, :due_at
    add_index :tasks, :updated_at
  end
end

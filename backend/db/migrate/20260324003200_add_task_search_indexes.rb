class AddTaskSearchIndexes < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      CREATE INDEX index_tasks_on_search_vector
      ON tasks
      USING GIN (
        to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
      );
    SQL

    execute <<~SQL
      CREATE INDEX index_tasks_on_title_trgm
      ON tasks
      USING GIN (title gin_trgm_ops);
    SQL

    execute <<~SQL
      CREATE INDEX index_tasks_on_description_trgm
      ON tasks
      USING GIN (description gin_trgm_ops);
    SQL
  end

  def down
    remove_index :tasks, name: :index_tasks_on_description_trgm
    remove_index :tasks, name: :index_tasks_on_title_trgm
    remove_index :tasks, name: :index_tasks_on_search_vector
  end
end

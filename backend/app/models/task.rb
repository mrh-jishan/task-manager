class Task < ApplicationRecord
  STATUSES = %w[open in_progress completed archived].freeze
  PRIORITIES = %w[low medium high urgent].freeze
  MIN_SEARCH_SIMILARITY = 0.2

  validates :title, presence: true, length: { maximum: 255 }
  validates :description, length: { maximum: 10_000 }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :priority, presence: true, inclusion: { in: PRIORITIES }

  scope :recent_first, -> { order(updated_at: :desc) }
  scope :with_status, ->(value) { value.present? ? where(status: value) : all }

  def self.search(query)
    normalized_query = query.to_s.strip
    return recent_first if normalized_query.blank?

    pattern = "%#{sanitize_sql_like(normalized_query)}%"
    quoted_query = connection.quote(normalized_query)

    select(<<~SQL.squish)
      tasks.*,
      ts_rank(
        to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')),
        websearch_to_tsquery('simple', #{quoted_query})
      ) AS search_rank,
      GREATEST(
        similarity(title, #{quoted_query}),
        similarity(coalesce(description, ''), #{quoted_query}),
        word_similarity(#{quoted_query}, title),
        word_similarity(#{quoted_query}, coalesce(description, ''))
      ) AS search_similarity
    SQL
      .where(
        <<~SQL.squish,
          to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
            @@ websearch_to_tsquery('simple', :query)
          OR title % :query
          OR coalesce(description, '') % :query
          OR word_similarity(:query, title) >= :min_similarity
          OR word_similarity(:query, coalesce(description, '')) >= :min_similarity
          OR title ILIKE :pattern
          OR coalesce(description, '') ILIKE :pattern
        SQL
        query: normalized_query,
        pattern: pattern,
        min_similarity: MIN_SEARCH_SIMILARITY
      )
      .order(Arel.sql("search_rank DESC, search_similarity DESC, updated_at DESC"))
  end
end

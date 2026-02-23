# frozen_string_literal: true

class CreateUserSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :user_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token, null: false
      t.timestamps
    end

    add_index :user_sessions, :token, unique: true
    add_index :user_sessions, [ :user_id, :created_at ]

    # Backfill: each existing user session_token becomes one user_session row
    reversible do |dir|
      dir.up do
        execute <<-SQL.squish
          INSERT INTO user_sessions (user_id, token, created_at, updated_at)
          SELECT id, session_token, NOW(), NOW()
          FROM users
          WHERE session_token IS NOT NULL AND session_token != ''
        SQL
      end
    end
  end
end

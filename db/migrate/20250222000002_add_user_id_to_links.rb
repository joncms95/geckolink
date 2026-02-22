# frozen_string_literal: true

class AddUserIdToLinks < ActiveRecord::Migration[7.2]
  def change
    add_reference :links, :user, null: true, foreign_key: true
    add_index :links, [ :user_id, :created_at ]
  end
end

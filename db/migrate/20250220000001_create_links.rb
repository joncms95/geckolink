# frozen_string_literal: true

class CreateLinks < ActiveRecord::Migration[7.2]
  def change
    create_table :links do |t|
      t.string :url, null: false
      t.string :short_code
      t.string :title
      t.integer :clicks_count, null: false, default: 0

      t.timestamps
    end

    add_index :links, :short_code, unique: true
  end
end

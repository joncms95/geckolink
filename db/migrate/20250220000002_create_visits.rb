# frozen_string_literal: true

class CreateVisits < ActiveRecord::Migration[7.2]
  def change
    create_table :visits do |t|
      t.references :link, null: false, foreign_key: true
      t.string :ip_address
      t.text :user_agent
      t.string :geolocation
      t.datetime :visited_at, null: false

      t.timestamps
    end

    add_index :visits, %i[link_id visited_at]
  end
end

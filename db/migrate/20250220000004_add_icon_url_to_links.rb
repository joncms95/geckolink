# frozen_string_literal: true

class AddIconUrlToLinks < ActiveRecord::Migration[7.2]
  def change
    add_column :links, :icon_url, :string
  end
end

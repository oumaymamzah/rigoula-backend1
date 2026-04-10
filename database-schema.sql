-- Create commande_details table
CREATE TABLE IF NOT EXISTS commande_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commande_id INT NOT NULL,
  produit_id INT NOT NULL,
  quantite INT NOT NULL,
  prix_unitaire DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
  FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE RESTRICT
);

-- Create visites table
CREATE TABLE IF NOT EXISTS visites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_commande_details_commande_id ON commande_details(commande_id);
CREATE INDEX idx_commande_details_produit_id ON commande_details(produit_id);
CREATE INDEX idx_visites_date ON visites(visited_at);

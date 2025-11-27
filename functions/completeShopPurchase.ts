import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      shopItemId, 
      nftId, 
      buyerEmail, 
      buyerWallet, 
      transactionHash,
      zekuAmount
    } = await req.json();

    console.log('🛒 [PURCHASE] Starting:', {
      shopItemId,
      nftId,
      buyerEmail,
      buyerWallet,
      txHash: transactionHash,
      amount: zekuAmount
    });

    // Verify buyer is the authenticated user
    if (buyerEmail !== user.email) {
      console.error('❌ [PURCHASE] Email mismatch:', { expected: user.email, received: buyerEmail });
      return Response.json({ 
        success: false, 
        message: 'Unauthorized: Email mismatch' 
      }, { status: 403 });
    }

    console.log('🔐 [PURCHASE] Using service role for all operations');

    // 1. Get shop item with service role
    const shopItems = await base44.asServiceRole.entities.ShopItem.filter({ id: shopItemId });
    
    if (shopItems.length === 0) {
      console.error('❌ [PURCHASE] Shop item not found:', shopItemId);
      return Response.json({ 
        success: false, 
        message: 'Shop item not found' 
      }, { status: 404 });
    }

    const shopItem = shopItems[0];
    console.log('📦 [PURCHASE] Shop item found:', shopItem.title);

    // 2. Get NFT with service role
    const nfts = await base44.asServiceRole.entities.NFT.filter({ id: nftId });
    
    if (nfts.length === 0) {
      console.error('❌ [PURCHASE] NFT not found:', nftId);
      return Response.json({ 
        success: false, 
        message: 'NFT not found' 
      }, { status: 404 });
    }

    const nft = nfts[0];
    console.log('🎨 [PURCHASE] NFT found:', nft.token_id);

    // 3. Get buyer's Agent ZK profile
    let buyerAgentZkId = null;
    let buyerUsername = buyerWallet.substring(0, 10);
    
    try {
      const profiles = await base44.asServiceRole.entities.AgentZKProfile.filter({
        user_email: buyerEmail
      });
      
      if (profiles.length > 0) {
        buyerAgentZkId = profiles[0].agent_zk_id;
        buyerUsername = profiles[0].username;
        console.log('👤 [PURCHASE] Buyer Agent ZK:', buyerAgentZkId);
      }
    } catch (profileErr) {
      console.log('⚠️ [PURCHASE] Could not load buyer profile, using wallet truncation');
    }

    // 4. Update shop item stock using SERVICE ROLE
    const newStock = Math.max(0, (shopItem.stock || 1) - 1);
    
    console.log('📉 [PURCHASE] Updating shop item stock from', shopItem.stock, 'to', newStock);
    
    try {
      await base44.asServiceRole.entities.ShopItem.update(shopItemId, {
        stock: newStock,
        status: newStock === 0 ? 'sold' : 'active'
      });
      console.log('✅ [PURCHASE] Shop item stock updated:', newStock);
    } catch (shopUpdateErr) {
      console.error('❌ [PURCHASE] Failed to update shop item:', shopUpdateErr);
      throw new Error('Failed to update shop item stock: ' + shopUpdateErr.message);
    }

    // 5. Get or create NFTVault for buyer
    const vaults = await base44.asServiceRole.entities.NFTVault.filter({
      user_email: buyerEmail
    });

    console.log('🔍 [PURCHASE] Found NFT vaults:', vaults.length);

    let vault;
    if (vaults.length === 0) {
      console.log('🆕 [PURCHASE] Creating NFT vault for buyer');
      try {
        vault = await base44.asServiceRole.entities.NFTVault.create({
          user_email: buyerEmail,
          wallet_address: buyerWallet,
          nft_ids: [nftId],
          total_nfts: 1,
          total_value_zeku: zekuAmount,
          is_locked: true,
          vault_created: new Date().toISOString()
        });
        console.log('✅ [PURCHASE] NFT Vault created:', vault.id);
      } catch (vaultCreateErr) {
        console.error('❌ [PURCHASE] Failed to create vault:', vaultCreateErr);
        throw new Error('Failed to create NFT vault: ' + vaultCreateErr.message);
      }
    } else {
      vault = vaults[0];
      console.log('📂 [PURCHASE] Using existing vault:', vault.id);
      
      const nftIds = vault.nft_ids || [];
      if (!nftIds.includes(nftId)) {
        nftIds.push(nftId);
      }
      
      try {
        await base44.asServiceRole.entities.NFTVault.update(vault.id, {
          nft_ids: nftIds,
          total_nfts: nftIds.length,
          total_value_zeku: (vault.total_value_zeku || 0) + zekuAmount
        });
        console.log('✅ [PURCHASE] Vault updated with new NFT');
      } catch (vaultUpdateErr) {
        console.error('❌ [PURCHASE] Failed to update vault:', vaultUpdateErr);
        throw new Error('Failed to update NFT vault: ' + vaultUpdateErr.message);
      }
    }

    // 6. Update NFT ownership with service role
    console.log('🔄 [PURCHASE] Transferring NFT ownership...');
    try {
      await base44.asServiceRole.entities.NFT.update(nftId, {
        owner_email: buyerEmail,
        owner_wallet: buyerWallet,
        owner_agent_zk_id: buyerAgentZkId,
        owner_agent_name: buyerUsername,
        sale_transaction: transactionHash,
        sold_at: new Date().toISOString(),
        previous_owner: nft.owner_email,
        in_nft_vault: true,
        vault_id: vault.id,
        is_listed: false
      });
      console.log('✅ [PURCHASE] NFT ownership transferred to:', buyerEmail);
    } catch (nftUpdateErr) {
      console.error('❌ [PURCHASE] Failed to update NFT:', nftUpdateErr);
      throw new Error('Failed to transfer NFT ownership: ' + nftUpdateErr.message);
    }

    console.log('✅ [PURCHASE] All operations completed successfully!');

    return Response.json({
      success: true,
      message: 'Purchase completed successfully',
      vault_id: vault.id,
      nft_id: nftId,
      transaction_hash: transactionHash
    });

  } catch (error) {
    console.error('❌ [PURCHASE] Error:', error);
    console.error('❌ [PURCHASE] Stack:', error.stack);
    
    return Response.json({ 
      success: false, 
      message: error.message || 'Internal server error',
      error: error.toString()
    }, { status: 500 });
  }
});
use anchor_lang::prelude::*;

declare_id!("AhS5LiD6UDwiv4nWgQRn7c5NthGi6v1KCbzYdy5NiX6B");

#[program]
pub mod gifwall {
  use super::*;
  pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;
    base_account.total_gifs = 0;
    Ok(())
  }

  pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;

    let item = ItemStruct {
        id: base_account.total_gifs + 1,
        gif_link: gif_link.to_string(),
        updoots: 0,
        user_address: *base_account.to_account_info().key,
    };

    base_account.gif_list.push(item);
    base_account.total_gifs += 1;
    Ok(())
  }

  pub fn updoot(ctx: Context<Updoot>, gif_id: u32) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;

    let gif_id = gif_id as u32;

    let gif = &mut base_account.gif_list.iter_mut().find(|x| x.id == gif_id);
    match gif {
        Some(ref mut gif) => {
            gif.updoots += 1;
        },
        None => {
            return Err(ProgramError::InvalidArgument);
        }
    }

    Ok(())
  }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program <'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[derive(Accounts)]
pub struct Updoot<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub id: u32,
    pub gif_link: String,
    pub user_address: Pubkey,
    pub updoots: u8,
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u32,
    pub gif_list: Vec<ItemStruct>,
}